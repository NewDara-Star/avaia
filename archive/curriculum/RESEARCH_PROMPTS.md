# Deep Research Prompts for Learning Path Curricula

Use these prompts with Claude Opus or GPT-4 to generate comprehensive curriculum data. Each prompt produces JSON that can be seeded directly into the Avaia database.

---

## PROMPT 1: JavaScript Web Development (0 → Mastery)

```
You are a world-class curriculum designer building a project-based learning path for JavaScript web development. Your goal is to take someone from absolute zero (never written code) to professional mastery (can build and deploy production web applications).

## Principles

1. **Project-First**: Every concept is taught THROUGH building something real. No isolated tutorials.
2. **Just-In-Time**: Concepts appear exactly when the project requires them, not before.
3. **Productive Failure**: Before complex concepts, include "sandbox" problems designed to fail so learners understand WHY the concept matters.
4. **Progressive Complexity**: Each project builds on previous skills while introducing new challenges.
5. **Real-World Relevance**: Projects should be things people actually build (not toy examples).

## Output Format

For each project in the path, provide:

{
  "id": "snake_case_project_id",
  "name": "Human Readable Name",
  "description": "What you'll build and why it matters",
  "estimated_hours": 10,
  "prerequisites": ["concept_ids", "required", "before", "starting"],
  "milestones": [
    {
      "id": 1,
      "name": "Milestone Name",
      "description": "What you'll accomplish",
      "concepts_introduced": [
        {
          "id": "concept_id",
          "name": "Concept Name",
          "why_now": "Why this concept is needed at this exact moment",
          "common_misconceptions": [
            {
              "id": "misconception_id",
              "belief": "What learners incorrectly believe",
              "reality": "What's actually true",
              "trigger": "What wrong answer reveals this",
              "remediation": "How to correct the mental model"
            }
          ],
          "sandbox_problem": {
            "problem": "An ill-structured problem that fails without this concept",
            "expected_failures": ["failure patterns learners will hit"],
            "reflection_questions": ["questions to ask after failure"]
          }
        }
      ],
      "concepts_reinforced": ["concept_ids", "practiced", "here"]
    }
  ]
}

## The Learning Path

Design 8-12 projects that progress from absolute beginner to advanced professional:

### Tier 1: Foundations (Projects 1-3)
- Pure JavaScript fundamentals
- DOM manipulation
- Event handling
- Basic state management
- Local storage

### Tier 2: Intermediate (Projects 4-6)  
- Asynchronous programming
- API integration
- Form handling
- Error handling
- Responsive design

### Tier 3: Advanced (Projects 7-9)
- Build tools (Vite/Webpack)
- Component architecture
- State management patterns
- Testing
- Authentication

### Tier 4: Professional (Projects 10-12)
- Full-stack integration
- Database operations
- Deployment
- Performance optimization
- Security best practices

## Requirements

1. Each project must have 4-8 milestones
2. Each milestone must introduce 1-3 concepts (no more)
3. Include at least 2 misconceptions per concept
4. Include a sandbox problem for abstract concepts
5. Concepts cannot appear before their prerequisites are taught
6. Projects should be fun and engaging (games, social apps, productivity tools)
7. The TOTAL concept count across all projects should be 80-120 concepts
8. Output valid JSON that can be parsed programmatically

Start with Project 1 and continue until you've covered the entire path from beginner to mastery.
```

---

## PROMPT 2: Python Data Science (0 → Mastery)

```
You are a world-class curriculum designer building a project-based learning path for Python Data Science. Your goal is to take someone from absolute zero (never written code) to professional mastery (can build ML models, create data pipelines, and generate actionable insights).

## Principles

1. **Project-First**: Every concept is taught THROUGH analyzing real data. No isolated tutorials.
2. **Just-In-Time**: Concepts appear exactly when the analysis requires them.
3. **Productive Failure**: Before complex concepts (vectorization, normalization, model selection), include problems designed to fail.
4. **Progressive Complexity**: Each project uses messier data and more sophisticated techniques.
5. **Business Relevance**: Projects should answer real business questions, not just manipulate data.

## Output Format

Same JSON structure as above, but with dataset info:

{
  "id": "project_id",
  "name": "Project Name",
  "description": "What you'll analyze and what insights you'll find",
  "dataset": {
    "name": "Dataset name",
    "source": "Where to get it (Kaggle, UCI, etc.)",
    "why": "Why this dataset is pedagogically valuable"
  },
  "estimated_hours": 12,
  "milestones": [...]
}

## The Learning Path

Design 10-14 projects:

### Tier 1: Python Foundations (Projects 1-3)
- Python syntax through data manipulation
- Variables, types, functions with data context
- Lists, dictionaries, loops for data processing
- File I/O with CSV
- Basic visualization (matplotlib)

### Tier 2: Data Manipulation (Projects 4-6)
- NumPy fundamentals (vectorization, broadcasting)
- Pandas DataFrames (selection, filtering, grouping)
- Data cleaning patterns (missing values, outliers)
- Exploratory Data Analysis workflow
- Statistical summaries

### Tier 3: Visualization & Statistics (Projects 7-9)
- Advanced visualization (Seaborn, Plotly)
- Statistical hypothesis testing
- Correlation vs causation (CRITICAL)
- A/B testing analysis
- Time series basics

### Tier 4: Machine Learning (Projects 10-12)
- Supervised learning (regression, classification)
- Model evaluation & cross-validation
- Feature engineering
- Unsupervised learning (clustering, PCA)
- Model deployment basics

### Tier 5: Advanced (Projects 13-14)
- Deep learning introduction (PyTorch/TensorFlow)
- NLP or Computer Vision capstone
- End-to-end pipeline project

## Key Misconceptions to Address

- "Correlation implies causation"
- "More features = better model"
- "Accuracy is the only metric that matters"
- "Data doesn't need cleaning"
- "AI/ML is magic black boxes"
- "Training accuracy = real-world performance"

Provide complete JSON output with all projects and milestones.
```

---

## PROMPT 3: Systems Programming in C (0 → Mastery)

```
You are a world-class curriculum designer building a project-based learning path for Systems Programming in C. Your goal is to take someone from zero to understanding how computers actually work at a low level (memory management, OS concepts, networking).

## Principles

1. **Project-First**: Every concept is taught by building real systems tools.
2. **Just-In-Time**: Pointers appear when they're needed, not as abstract theory first.
3. **Productive Failure**: Memory bugs are learning opportunities. Segfaults teach.
4. **Progressive Complexity**: From single-file programs to multi-module systems.
5. **Demystification**: The goal is understanding, not fear of low-level programming.

## The Learning Path

Design 10-12 projects:

### Tier 1: C Foundations (Projects 1-3)
- Compilation process (source → binary)
- Types, variables, functions
- Pointers and arrays (THE core concept)
- Strings and memory layout
- Structs and custom types

### Tier 2: Memory Mastery (Projects 4-6)
- Stack vs heap (build a visualization)
- Dynamic allocation (malloc/free patterns)
- Memory debugging (valgrind, address sanitizer)
- Linked lists from scratch
- Hash tables from scratch

### Tier 3: Systems Concepts (Projects 7-9)
- File I/O at the syscall level
- Process creation (fork/exec)
- Signals and inter-process communication
- Basic networking (sockets)
- Multithreading (pthreads)

### Tier 4: Capstone (Projects 10-12)
- Build a shell (process management)
- Build a memory allocator (malloc clone)
- Build a simple database or HTTP server

## Key Misconceptions

- "Pointers are just scary numbers" (they're typed addresses)
- "Memory is infinite" (heap isn't magic)
- "Segfaults are random" (they're deterministic bugs)
- "malloc always succeeds" (it can fail)
- "free() immediately returns memory to OS" (it doesn't)
- "Arrays and pointers are the same" (subtle differences)

Provide complete JSON output.
```

---

## PROMPT 4: Core CS Theory & Algorithms (0 → Interview Ready)

```
You are a world-class curriculum designer building a project-based learning path for Computer Science fundamentals and algorithms. Your goal is to take someone from basic programming to confidently solving algorithmic problems (FAANG interview level).

## Principles

1. **Project-First**: Each data structure/algorithm is taught by building something useful.
2. **Just-In-Time**: Binary search appears when a project needs fast lookups.
3. **Productive Failure**: Give problems where O(n²) solutions time out, forcing optimization.
4. **Pattern Recognition**: Group similar problems so patterns emerge naturally.
5. **Interview Ready**: By the end, learner can confidently handle technical interviews.

## The Learning Path

### Tier 1: Data Structures (Projects 1-4)
- Arrays and strings manipulation (text editor)
- Linked lists (build an undo system)
- Stacks and queues (build a calculator, BFS puzzle)
- Hash maps (build a cache/frequency counter)

### Tier 2: Trees & Graphs (Projects 5-8)
- Binary trees and traversals (file system navigator)
- Binary search trees (autocomplete system)
- Heaps and priority queues (task scheduler)
- Graphs (social network, shortest path, dependency resolver)

### Tier 3: Algorithm Patterns (Projects 9-12)
- Two pointers technique (sorted array problems)
- Sliding window (substring problems)
- Recursion and backtracking (sudoku solver)
- Dynamic programming (sequence problems, optimization)

### Tier 4: Advanced (Projects 13-15)
- System design basics (design concepts, not code)
- Complexity analysis mastery
- Mock interview simulation (random problem + timer)

## Key Misconceptions

- "Brute force is always wrong" (sometimes it's optimal)
- "Recursion is always slower than iteration" (tail call optimization)
- "Dynamic programming is magic" (it's just memoization + structure)
- "Big O is just about speed" (also space, I/O, etc.)
- "There's always one right answer" (tradeoffs exist)

Provide complete JSON with problems, optimal solutions hints, and common mistakes.
```

---

## PROMPT 5: Machine Learning & AI (Foundations → Practitioner)

```
You are a world-class curriculum designer building a project-based learning path for Machine Learning and AI.

Prerequisites: Basic Python, basic statistics
Goal: Build, evaluate, and deploy production ML models

## Principles

1. **Project-First**: Every algorithm is taught through a real predictive task.
2. **Math as Needed**: Linear algebra appears when implementing gradient descent.
3. **Productive Failure**: Show what happens when you skip normalization or validation.
4. **Intuition Over Formulas**: Build understanding before equations.
5. **End-to-End Focus**: From raw data to deployed model.

## The Learning Path

### Tier 1: Supervised Learning (Projects 1-4)
- Linear regression (predict housing prices - Boston/Ames)
- Logistic regression (classify spam/ham emails)
- Decision trees (medical diagnosis with interpretability)
- Ensemble methods (Random Forest, XGBoost - Kaggle competition)

### Tier 2: Model Mastery (Projects 5-7)
- Feature engineering deep dive (Titanic survival)
- Cross-validation and hyperparameter tuning
- Dealing with imbalanced data (fraud detection)
- Model interpretation (SHAP, LIME - explain predictions)

### Tier 3: Unsupervised Learning (Projects 8-9)
- Clustering (customer segmentation for marketing)
- Dimensionality reduction (PCA for visualization)

### Tier 4: Deep Learning (Projects 10-12)
- Neural network from scratch (MNIST - understand backprop)
- CNNs for image classification (build image classifier)
- Transformers/RNNs for text (sentiment analysis)

### Tier 5: Production (Projects 13-14)
- Model deployment (FastAPI + Docker)
- Monitoring, A/B testing, and retraining pipelines

## Key Misconceptions

- "More data always helps" (diminishing returns, garbage in/out)
- "Deep learning beats everything" (simpler models often win)
- "Accuracy is the goal" (precision/recall tradeoffs)
- "Models learn causation" (correlation only)
- "Training accuracy = real-world performance" (overfitting)
- "Feature scaling doesn't matter" (it does for most algorithms)

Provide complete JSON.
```

---

## How to Use These Prompts

1. Run each prompt with **Claude Opus** or **GPT-4** (use smartest model)
2. Validate the JSON output (parse it, check structure)
3. Store in `/Users/Star/avaia/curriculum/` as `{domain}.json`
4. Import into database with seeding script
5. Test with real learners, iterate based on feedback

## Expected Output Size

Each prompt should produce:
- 8-15 projects
- 50-120 concepts per domain
- 100-300 misconceptions per domain
- 25-75 sandbox problems per domain

This data becomes the foundation of Avaia's knowledge.
