/**
 * Track Tools
 * Learning track management: listing, selection, and dynamic generation
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDatabase, generateId, parseJson, toJson } from '../db/index.js';

// =============================================================================
// Tool: get_learning_tracks
// =============================================================================

const GetLearningTracksInput = z.object({
    include_dynamic: z.boolean().optional().describe('Include non-preseeded (dynamic) tracks'),
});

async function getLearningTracks(args: z.infer<typeof GetLearningTracksInput>) {
    const db = getDatabase();

    const whereClause = args.include_dynamic ? '' : 'WHERE is_preseeded = TRUE';

    const tracks = db.prepare(`
        SELECT 
            lt.id, lt.name, lt.description, lt.language, lt.domain, 
            lt.difficulty, lt.is_preseeded,
            COUNT(pt.id) as project_count,
            SUM(pt.estimated_hours) as total_hours
        FROM learning_track lt
        LEFT JOIN project_template pt ON pt.track_id = lt.id
        ${whereClause}
        GROUP BY lt.id
        ORDER BY lt.is_preseeded DESC, lt.name ASC
    `).all() as Array<{
        id: string;
        name: string;
        description: string | null;
        language: string | null;
        domain: string | null;
        difficulty: string;
        is_preseeded: number;
        project_count: number;
        total_hours: number | null;
    }>;

    return {
        tracks: tracks.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            language: t.language,
            domain: t.domain,
            difficulty: t.difficulty,
            is_preseeded: !!t.is_preseeded,
            project_count: t.project_count,
            estimated_total_hours: t.total_hours || 0,
        })),
        count: tracks.length,
    };
}

// =============================================================================
// Tool: select_learning_track
// =============================================================================

const SelectLearningTrackInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    track_id: z.string().describe('The learning track to assign'),
});

async function selectLearningTrack(args: z.infer<typeof SelectLearningTrackInput>) {
    const db = getDatabase();

    // Verify track exists
    const track = db.prepare(`
        SELECT id, name FROM learning_track WHERE id = ?
    `).get(args.track_id) as { id: string; name: string } | undefined;

    if (!track) {
        return { error: 'Track not found', track_id: args.track_id };
    }

    // Update learner's current track
    db.prepare(`
        UPDATE learner SET current_track_id = ? WHERE id = ?
    `).run(args.track_id, args.learner_id);

    // Get first project template in track
    const firstProject = db.prepare(`
        SELECT id, name, description, estimated_hours, milestones
        FROM project_template
        WHERE track_id = ?
        ORDER BY sequence_order ASC
        LIMIT 1
    `).get(args.track_id) as {
        id: string;
        name: string;
        description: string | null;
        estimated_hours: number | null;
        milestones: string;
    } | undefined;

    if (!firstProject) {
        return {
            track_assigned: true,
            track_id: args.track_id,
            track_name: track.name,
            first_project: null,
            message: 'Track assigned but no projects found. Track may need seeding.',
        };
    }

    // Create project instance from template
    const projectId = generateId('proj');
    db.prepare(`
        INSERT INTO project (id, learner_id, name, template_id, status, started_at)
        VALUES (?, ?, ?, ?, 'in_progress', datetime('now'))
    `).run(projectId, args.learner_id, firstProject.name, firstProject.id);

    const milestones = parseJson<Array<{ id: number; name: string; description: string }>>(firstProject.milestones, []);

    return {
        track_assigned: true,
        track_id: args.track_id,
        track_name: track.name,
        first_project: {
            project_id: projectId,
            template_id: firstProject.id,
            name: firstProject.name,
            description: firstProject.description,
            estimated_hours: firstProject.estimated_hours,
            milestones: milestones,
        },
        message: `You're now on the ${track.name} track! Starting with: ${firstProject.name}`,
    };
}

// =============================================================================
// Tool: get_track_progress
// =============================================================================

const GetTrackProgressInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
});

async function getTrackProgress(args: z.infer<typeof GetTrackProgressInput>) {
    const db = getDatabase();

    // Get learner's current track
    const learner = db.prepare(`
        SELECT current_track_id FROM learner WHERE id = ?
    `).get(args.learner_id) as { current_track_id: string | null } | undefined;

    if (!learner || !learner.current_track_id) {
        return {
            has_track: false,
            message: 'No learning track assigned. Use get_learning_tracks() to see available tracks.',
        };
    }

    // Get track info
    const track = db.prepare(`
        SELECT id, name, description, language, domain FROM learning_track WHERE id = ?
    `).get(learner.current_track_id) as {
        id: string; name: string; description: string | null;
        language: string | null; domain: string | null;
    };

    // Get all projects in track
    const templates = db.prepare(`
        SELECT id, sequence_order, name FROM project_template
        WHERE track_id = ? ORDER BY sequence_order ASC
    `).all(learner.current_track_id) as Array<{ id: string; sequence_order: number; name: string }>;

    // Get learner's completed projects for this track
    const completedProjects = db.prepare(`
        SELECT template_id FROM project
        WHERE learner_id = ? AND status = 'completed' AND template_id IN (
            SELECT id FROM project_template WHERE track_id = ?
        )
    `).all(args.learner_id, learner.current_track_id) as Array<{ template_id: string }>;

    const completedIds = new Set(completedProjects.map(p => p.template_id));

    // Get current active project
    const activeProject = db.prepare(`
        SELECT id, name, template_id, current_milestone FROM project
        WHERE learner_id = ? AND status = 'in_progress'
        ORDER BY started_at DESC LIMIT 1
    `).get(args.learner_id) as {
        id: string; name: string; template_id: string | null; current_milestone: number;
    } | undefined;

    return {
        has_track: true,
        track: {
            id: track.id,
            name: track.name,
            description: track.description,
            language: track.language,
            domain: track.domain,
        },
        progress: {
            total_projects: templates.length,
            completed_projects: completedIds.size,
            current_project: activeProject ? {
                project_id: activeProject.id,
                name: activeProject.name,
                current_milestone: activeProject.current_milestone,
            } : null,
        },
        projects: templates.map(t => ({
            template_id: t.id,
            sequence: t.sequence_order,
            name: t.name,
            status: completedIds.has(t.id) ? 'completed' :
                (activeProject?.template_id === t.id ? 'in_progress' : 'not_started'),
        })),
    };
}

// =============================================================================
// Tool: generate_learning_track
// =============================================================================

const GenerateLearningTrackInput = z.object({
    learner_id: z.string().describe('The learner\'s unique identifier'),
    goal: z.string().describe('What the learner wants to learn (e.g., "Rust programming", "iOS development")'),
    context: z.string().optional().describe('Additional context: background, specific project, time available'),
});

async function generateLearningTrack(args: z.infer<typeof GenerateLearningTrackInput>) {
    // This tool returns instructions for the AI to generate the curriculum
    // The actual generation happens in the AI's response, then seeds via other tools

    return {
        action: 'generate_curriculum',
        learner_id: args.learner_id,
        goal: args.goal,
        context: args.context || 'No additional context provided',
        generation_instructions: {
            format: 'Generate a project-based learning curriculum',
            guidelines: [
                'Create 4-8 projects that progress from current level to goal',
                'Each project should have 4-6 milestones',
                'Each milestone should introduce 1-3 concepts',
                'Include common misconceptions for each concept',
                'Include prerequisite concepts where applicable',
                'Projects should be real-world applications, not toy examples',
            ],
            output_format: `Return a JSON object with this structure:
{
  "track": {
    "id": "custom-[topic]-[random]",
    "name": "[Topic] Learning Path",
    "description": "[What this track teaches]",
    "language": "[primary language]",
    "domain": "[domain: web, data, systems, mobile, ai]",
    "difficulty": "beginner|intermediate|advanced"
  },
  "projects": [
    {
      "sequence_order": 1,
      "name": "[Project Name]",
      "description": "[What you'll build]",
      "estimated_hours": 10,
      "milestones": [
        {
          "id": 1,
          "name": "[Milestone Name]",
          "description": "[What you'll accomplish]",
          "concepts": [
            {
              "id": "concept_snake_case",
              "name": "Concept Name",
              "relationship": "introduces|requires|reinforces"
            }
          ]
        }
      ]
    }
  ]
}`,
            next_step: 'After generating, call seed_dynamic_track() with the JSON to save it to the database',
        },
        model_suggestion: 'Use the most capable model (Opus) for curriculum generation to ensure high quality',
    };
}

// =============================================================================
// Tool: seed_dynamic_track
// =============================================================================

const SeedDynamicTrackInput = z.object({
    learner_id: z.string().describe('The learner who requested this track'),
    track_json: z.string().describe('The JSON string containing track and projects data'),
});

async function seedDynamicTrack(args: z.infer<typeof SeedDynamicTrackInput>) {
    const db = getDatabase();

    let data: {
        track: {
            id: string;
            name: string;
            description?: string;
            language?: string;
            domain?: string;
            difficulty?: string;
        };
        projects: Array<{
            sequence_order: number;
            name: string;
            description?: string;
            estimated_hours?: number;
            milestones: Array<{
                id: number;
                name: string;
                description?: string;
                concepts?: Array<{
                    id: string;
                    name: string;
                    relationship?: string;
                }>;
            }>;
        }>;
    };

    try {
        data = JSON.parse(args.track_json);
    } catch (e) {
        return { error: 'Invalid JSON', details: String(e) };
    }

    const trackId = data.track.id || generateId('track');

    // Insert learning track
    db.prepare(`
        INSERT INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)
    `).run(
        trackId,
        data.track.name,
        data.track.description || null,
        data.track.language || null,
        data.track.domain || null,
        data.track.difficulty || 'beginner',
        args.learner_id
    );

    let projectsCreated = 0;
    let conceptsCreated = 0;

    // Insert projects
    for (const project of data.projects) {
        const templateId = generateId('template');

        db.prepare(`
            INSERT INTO project_template (id, track_id, sequence_order, name, description, estimated_hours, milestones)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            templateId,
            trackId,
            project.sequence_order,
            project.name,
            project.description || null,
            project.estimated_hours || null,
            toJson(project.milestones)
        );
        projectsCreated++;

        // Insert milestone-concept mappings
        for (const milestone of project.milestones) {
            if (milestone.concepts) {
                for (const concept of milestone.concepts) {
                    // Auto-create concept if it doesn't exist
                    const existingConcept = db.prepare('SELECT id FROM concept WHERE id = ?').get(concept.id);
                    if (!existingConcept) {
                        db.prepare(`
                            INSERT INTO concept (id, name, category)
                            VALUES (?, ?, 'Dynamic')
                        `).run(concept.id, concept.name);
                        conceptsCreated++;
                    }

                    // Insert milestone-concept mapping
                    db.prepare(`
                        INSERT OR IGNORE INTO milestone_concept (project_template_id, milestone_number, concept_id, relationship)
                        VALUES (?, ?, ?, ?)
                    `).run(templateId, milestone.id, concept.id, concept.relationship || 'introduces');
                }
            }
        }
    }

    // Assign learner to this track
    db.prepare(`UPDATE learner SET current_track_id = ? WHERE id = ?`).run(trackId, args.learner_id);

    return {
        success: true,
        track_id: trackId,
        track_name: data.track.name,
        projects_created: projectsCreated,
        concepts_created: conceptsCreated,
        message: `Created learning track "${data.track.name}" with ${projectsCreated} projects. Learner assigned to track.`,
        next_step: 'Call select_learning_track() to start the first project, or it will start automatically.',
    };
}

// =============================================================================
// Tool Registration
// =============================================================================

export function registerTrackTools(server: McpServer): void {
    server.tool(
        'get_learning_tracks',
        'Returns available learning tracks (pre-seeded curricula). Call when learner asks what they can learn or during onboarding.',
        GetLearningTracksInput.shape,
        async (args) => {
            const result = await getLearningTracks(GetLearningTracksInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'select_learning_track',
        'Assigns a learner to a learning track and starts the first project. Call when learner chooses a track.',
        SelectLearningTrackInput.shape,
        async (args) => {
            const result = await selectLearningTrack(SelectLearningTrackInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'get_track_progress',
        'Returns learner\'s progress in their current learning track. Shows completed projects, current project, and what\'s next.',
        GetTrackProgressInput.shape,
        async (args) => {
            const result = await getTrackProgress(GetTrackProgressInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'generate_learning_track',
        'Returns instructions for generating a custom learning track when learner wants to learn something not in pre-seeded tracks. ' +
        'After AI generates the curriculum JSON, call seed_dynamic_track() to save it.',
        GenerateLearningTrackInput.shape,
        async (args) => {
            const result = await generateLearningTrack(GenerateLearningTrackInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );

    server.tool(
        'seed_dynamic_track',
        'Saves a dynamically generated learning track to the database. Call after generating curriculum JSON with generate_learning_track().',
        SeedDynamicTrackInput.shape,
        async (args) => {
            const result = await seedDynamicTrack(SeedDynamicTrackInput.parse(args));
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    );
}
