/**
 * Python Data Science Curriculum Seeder
 * Seeds the complete 14-project Python Data Science curriculum
 * Source: /Users/Star/avaia/concept-research/Python Data Science Project Curriculum.md
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

const pythonDataTrack = {
    id: 'python-data',
    name: 'Python Data Science',
    description: '14 projects from VC Analyst to Medical AI. Master Python, Pandas, Statistics, Machine Learning, NLP, and CNNs through real-world business scenarios. Productive Failure pedagogy with messy Kaggle datasets.',
    language: 'python',
    domain: 'data-science',
    difficulty: 'beginner',
    is_preseeded: true,
    created_by: 'system'
};

const projectTemplates = [
    // =========================================================================
    // TIER 1: Python Foundations (Scripting Phase) - NO PANDAS ALLOWED
    // =========================================================================
    {
        id: 'pyds_01_vc_analyst',
        sequence_order: 1,
        name: 'The VC Analyst: Shark Tank Deal Finder',
        description: 'Analyze Shark Tank US pitch data to identify the most generous sharks and highest-equity deals using native Python lists and loops.',
        estimated_hours: 8,
        dataset: { name: 'Shark Tank US Pitches', source: 'Kaggle (ryanburnsworth)' },
        milestones: [
            { id: 1, name: 'Ingestion', description: 'Load shark_tank.csv using csv module. Print first 5 rows.' },
            { id: 2, name: 'Cleaning', description: 'Strip "%" from Equity column and convert to float.' },
            { id: 3, name: 'Analysis', description: 'Iterate through cleaned list to find maximum Equity value.' },
            { id: 4, name: 'Aggregation', description: 'Use dictionary to count frequency of each Shark (histogram from scratch).' }
        ],
        concepts: [
            { id: 'csv_module', name: 'CSV Module', milestone: 1, relationship: 'introduces' },
            { id: 'list_of_lists', name: 'List of Lists (2D Array)', milestone: 1, relationship: 'introduces' },
            { id: 'for_loops', name: 'For Loops', milestone: 2, relationship: 'introduces' },
            { id: 'type_casting', name: 'Type Casting', milestone: 2, relationship: 'introduces' },
            { id: 'string_manipulation', name: 'String Manipulation', milestone: 2, relationship: 'introduces' },
            { id: 'conditionals_py', name: 'Conditionals', milestone: 3, relationship: 'introduces' },
            { id: 'dict_aggregation', name: 'Dictionary Aggregation', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_string_math', concept: 'type_casting', belief: 'Numbers in CSV are already numbers', reality: 'CSV parses everything as strings. "10%" cannot be multiplied. Must strip and cast.' }
        ]
    },
    {
        id: 'pyds_02_hr_auditor',
        sequence_order: 2,
        name: 'The HR Auditor: SF Salary Analysis',
        description: 'Audit public salary records to calculate average pay and identify data anomalies. Master error handling and reusable functions.',
        estimated_hours: 10,
        dataset: { name: 'SF Salaries', source: 'Kaggle (City of San Francisco)' },
        milestones: [
            { id: 1, name: 'Modularization', description: 'Define clean_salary_field function that takes raw string, returns float.' },
            { id: 2, name: 'Defensive Programming', description: 'Implement try-except blocks. Log errors to separate audit list.' },
            { id: 3, name: 'Logic Implementation', description: 'Calculate average pay excluding dirty rows from denominator.' },
            { id: 4, name: 'String Matching', description: 'Filter JobTitle for keywords (Police, Fire) to compare salaries.' }
        ],
        concepts: [
            { id: 'functions_py', name: 'Functions', milestone: 1, relationship: 'introduces' },
            { id: 'dry_principle', name: 'DRY Principle', milestone: 1, relationship: 'introduces' },
            { id: 'try_except', name: 'Exception Handling (try-except)', milestone: 2, relationship: 'introduces' },
            { id: 'error_logging', name: 'Error Logging', milestone: 2, relationship: 'introduces' },
            { id: 'none_handling', name: 'None Handling', milestone: 3, relationship: 'introduces' },
            { id: 'string_methods', name: 'String Methods', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_data_clean', concept: 'try_except', belief: 'Data is clean if it looks numeric', reality: 'Row 10,052 contains "Not Provided" as string. Script crashes without defensive code.' }
        ]
    },
    {
        id: 'pyds_03_supply_chain',
        sequence_order: 3,
        name: 'The Supply Chain Manager: Avocado Trends',
        description: 'Track price fluctuations of avocados across US regions. Master datetime parsing, dictionary aggregation, and matplotlib.',
        estimated_hours: 12,
        dataset: { name: 'Avocado Prices', source: 'Kaggle (Hass Avocado Board)' },
        milestones: [
            { id: 1, name: 'Temporal Parsing', description: 'Convert string dates to datetime objects for chronological sorting.' },
            { id: 2, name: 'Dictionary Aggregation', description: 'Build dict where Key=Region, Value=List of Prices.' },
            { id: 3, name: 'Logic', description: 'Calculate average price per region by averaging list values.' },
            { id: 4, name: 'Visualization', description: 'Use matplotlib.pyplot for line charts comparing Organic vs Conventional.' }
        ],
        concepts: [
            { id: 'datetime_module', name: 'Datetime Module', milestone: 1, relationship: 'introduces' },
            { id: 'date_parsing', name: 'Date Parsing', milestone: 1, relationship: 'introduces' },
            { id: 'nested_dict', name: 'Nested Dictionaries', milestone: 2, relationship: 'introduces' },
            { id: 'matplotlib_intro', name: 'Matplotlib Introduction', milestone: 4, relationship: 'introduces' },
            { id: 'line_charts', name: 'Line Charts', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_date_string_sort', concept: 'date_parsing', belief: 'String dates sort chronologically', reality: '"2015-12-27" sorts after "2016-01-01" as strings. Must parse to datetime.' }
        ]
    },

    // =========================================================================
    // TIER 2: Data Manipulation (Vectorization Phase) - PANDAS INTRODUCTION
    // =========================================================================
    {
        id: 'pyds_04_ecommerce_analyst',
        sequence_order: 4,
        name: 'The E-Commerce Analyst: RFM Segmentation',
        description: 'Perform RFM analysis on 500k+ transactions. Transition from loops to vectorized Pandas operations.',
        estimated_hours: 14,
        dataset: { name: 'Online Retail II', source: 'UCI ML Repository / Kaggle' },
        milestones: [
            { id: 1, name: 'Ingestion & Optimization', description: 'Compare for-loop vs vectorized multiplication execution time.' },
            { id: 2, name: 'Filtering', description: 'Use boolean masking to remove cancelled orders (Quantity < 0).' },
            { id: 3, name: 'Aggregation', description: 'groupby CustomerID to calculate Recency, Frequency, Monetary.' },
            { id: 4, name: 'Reporting', description: 'Export segmented customer list to CSV.' }
        ],
        concepts: [
            { id: 'pandas_dataframe', name: 'Pandas DataFrame', milestone: 1, relationship: 'introduces' },
            { id: 'vectorization', name: 'Vectorization', milestone: 1, relationship: 'introduces' },
            { id: 'boolean_indexing', name: 'Boolean Indexing', milestone: 2, relationship: 'introduces' },
            { id: 'groupby', name: 'GroupBy', milestone: 3, relationship: 'introduces' },
            { id: 'rfm_analysis', name: 'RFM Analysis', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_loop_fine', concept: 'vectorization', belief: 'For loops work fine for large datasets', reality: '500k rows takes 45+ seconds with loops. Vectorized: milliseconds. NumPy broadcasting.' }
        ]
    },
    {
        id: 'pyds_05_data_janitor',
        sequence_order: 5,
        name: 'The Data Janitor: FIFA 21 Cleaning',
        description: 'Transform messy scraped data into clean analytical asset. Master regex, lambda functions, and type casting in DataFrames.',
        estimated_hours: 15,
        dataset: { name: 'FIFA 21 Messy Raw Dataset', source: 'Kaggle (yagunnersya)' },
        milestones: [
            { id: 1, name: 'Complex Parsing', description: 'Convert "M" (millions) and "K" (thousands) suffixes to integers.' },
            { id: 2, name: 'Unit Conversion', description: 'Parse Height (6\'0") and convert to centimeters.' },
            { id: 3, name: 'String Cleaning', description: 'Remove non-numeric characters from star-rating columns using Regex.' },
            { id: 4, name: 'Derived Metrics', description: 'Create Value-to-Wage Ratio column for undervalued players.' }
        ],
        concepts: [
            { id: 'pandas_apply', name: 'Pandas .apply()', milestone: 1, relationship: 'introduces' },
            { id: 'lambda_functions', name: 'Lambda Functions', milestone: 1, relationship: 'introduces' },
            { id: 'regex_python', name: 'Regular Expressions (re)', milestone: 3, relationship: 'introduces' },
            { id: 'unit_conversion', name: 'Unit Conversion', milestone: 2, relationship: 'introduces' },
            { id: 'feature_engineering', name: 'Feature Engineering', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_sort_text_number', concept: 'regex_python', belief: 'Sorting Value column works correctly', reality: '"€100M" sorts after "€9M" because 1 < 9 in text. Must convert to numeric.' }
        ]
    },
    {
        id: 'pyds_06_public_health',
        sequence_order: 6,
        name: 'The Public Health Researcher: Insurance Cost Drivers',
        description: 'Identify primary drivers of medical insurance charges. Master pivot tables and correlation matrices.',
        estimated_hours: 12,
        dataset: { name: 'Medical Insurance Cost', source: 'Kaggle (Miri Choi)' },
        milestones: [
            { id: 1, name: 'Distribution Analysis', description: 'Use .describe() and histograms to identify skew in charges.' },
            { id: 2, name: 'Pivot Tables', description: 'Create pivot table: Average Charges by Region (Index) and Smoker (Columns).' },
            { id: 3, name: 'Binning', description: 'Create BMI_Class categorical column from continuous bmi.' },
            { id: 4, name: 'Correlation', description: 'Generate correlation matrix. Identify Smoking and BMI as top drivers.' }
        ],
        concepts: [
            { id: 'describe', name: 'DataFrame .describe()', milestone: 1, relationship: 'introduces' },
            { id: 'histograms', name: 'Histograms', milestone: 1, relationship: 'introduces' },
            { id: 'pivot_table', name: 'Pivot Tables', milestone: 2, relationship: 'introduces' },
            { id: 'pd_cut', name: 'pd.cut() Binning', milestone: 3, relationship: 'introduces' },
            { id: 'correlation_matrix', name: 'Correlation Matrix', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_mean_enough', concept: 'pivot_table', belief: 'Global mean tells the full story', reality: 'Global mean ~$13k. Smokers ~$32k. Must stratify by category to find truth.' }
        ]
    },

    // =========================================================================
    // TIER 3: Visualization & Statistics (Inference Phase)
    // =========================================================================
    {
        id: 'pyds_07_paradox_hunter',
        sequence_order: 7,
        name: 'The Paradox Hunter: Investigating Bias at Berkeley',
        description: 'Disprove false narrative of gender bias by uncovering Simpson\'s Paradox. Learn confounding variables.',
        estimated_hours: 10,
        dataset: { name: 'UC Berkeley 1973 Admissions', source: 'Discovery.cs.illinois.edu' },
        milestones: [
            { id: 1, name: 'Aggregate Analysis', description: 'Calculate and plot overall admission rate by Gender. Observe apparent bias.' },
            { id: 2, name: 'Stratification', description: 'Calculate admission rates by Gender within each Department.' },
            { id: 3, name: 'Visualization', description: 'Create FacetGrid (Small Multiples) showing trend reversal by Department.' },
            { id: 4, name: 'Narrative', description: 'Write explanation of paradox (Women applied to competitive departments).' }
        ],
        concepts: [
            { id: 'simpsons_paradox', name: 'Simpson\'s Paradox', milestone: 2, relationship: 'introduces' },
            { id: 'confounding_variables', name: 'Confounding Variables', milestone: 2, relationship: 'introduces' },
            { id: 'seaborn_factorplot', name: 'Seaborn Factor/Bar Plot', milestone: 3, relationship: 'introduces' },
            { id: 'facetgrid', name: 'FacetGrid (Small Multiples)', milestone: 3, relationship: 'introduces' },
            { id: 'stratification', name: 'Data Stratification', milestone: 2, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_correlation_causation', concept: 'confounding_variables', belief: 'Aggregate statistics tell the truth', reality: 'Men 44% admitted vs Women 35%. But per-department, women equal or higher. Confounding variable: department.' }
        ]
    },
    {
        id: 'pyds_08_growth_hacker',
        sequence_order: 8,
        name: 'The Growth Hacker: A/B Testing Mobile Games',
        description: 'Determine if moving a game feature increased player retention using bootstrapping and hypothesis testing.',
        estimated_hours: 14,
        dataset: { name: 'Cookie Cats A/B Test', source: 'Kaggle (Tactile Entertainment)' },
        milestones: [
            { id: 1, name: 'Metric Calculation', description: 'Calculate 1-day and 7-day retention rates for both groups.' },
            { id: 2, name: 'Bootstrapping', description: 'Write loop to resample data 1000 times, calculate difference in means.' },
            { id: 3, name: 'Distribution Visualization', description: 'Plot KDE of differences between groups.' },
            { id: 4, name: 'Decision', description: 'Determine if statistical evidence supports rolling out change.' }
        ],
        concepts: [
            { id: 'ab_testing', name: 'A/B Testing', milestone: 1, relationship: 'introduces' },
            { id: 'bootstrapping', name: 'Bootstrapping', milestone: 2, relationship: 'introduces' },
            { id: 'resampling', name: 'Resampling with Replacement', milestone: 2, relationship: 'introduces' },
            { id: 'kde_plot', name: 'Kernel Density Estimate', milestone: 3, relationship: 'introduces' },
            { id: 'confidence_intervals', name: 'Confidence Intervals', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_difference_meaningful', concept: 'bootstrapping', belief: '1% difference means A is better', reality: 'Without confidence interval, no certainty. Bootstrapping shows distribution of possible differences.' }
        ]
    },
    {
        id: 'pyds_09_real_estate',
        sequence_order: 9,
        name: 'The Real Estate Mogul: Housing Market Analysis',
        description: 'Analyze housing features for price drivers. Master pairplots, boxplots, log transformations, and outlier removal.',
        estimated_hours: 12,
        dataset: { name: 'Boston House Prices', source: 'Kaggle / Scikit-Learn' },
        milestones: [
            { id: 1, name: 'Univariate Analysis', description: 'Plot histograms for all variables. Notice right-skew on Price and Crime.' },
            { id: 2, name: 'Transformation', description: 'Apply np.log1p to skewed features. Re-plot to observe normalization.' },
            { id: 3, name: 'Bivariate Analysis', description: 'Use sns.regplot for linear relationships.' },
            { id: 4, name: 'Outlier Removal', description: 'Use IQR method to filter extreme outliers.' }
        ],
        concepts: [
            { id: 'pairplot', name: 'Seaborn Pairplot', milestone: 1, relationship: 'introduces' },
            { id: 'log_transformation', name: 'Log Transformation', milestone: 2, relationship: 'introduces' },
            { id: 'regplot', name: 'Regression Plot', milestone: 3, relationship: 'introduces' },
            { id: 'boxplot', name: 'Box Plots', milestone: 4, relationship: 'introduces' },
            { id: 'iqr_outliers', name: 'IQR Outlier Detection', milestone: 4, relationship: 'introduces' },
            { id: 'multicollinearity', name: 'Multicollinearity', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_linear_always', concept: 'log_transformation', belief: 'Scatterplot shows clear trend', reality: 'Clustered blob because Crime is skewed. Log transform linearizes relationship.' }
        ]
    },

    // =========================================================================
    // TIER 4: Machine Learning (Prediction Phase)
    // =========================================================================
    {
        id: 'pyds_10_churn_predictor',
        sequence_order: 10,
        name: 'The Churn Predictor: Retaining Telecom Customers',
        description: 'Build classification model to predict customer churn. Handle class imbalance and optimize for Recall.',
        estimated_hours: 16,
        dataset: { name: 'Telco Customer Churn', source: 'Kaggle (IBM Sample Data)' },
        milestones: [
            { id: 1, name: 'Preprocessing', description: 'Convert categorical variables using pd.get_dummies (One-Hot Encoding).' },
            { id: 2, name: 'Splitting', description: 'Implement train_test_split for holdout validation set.' },
            { id: 3, name: 'Modeling', description: 'Train Logistic Regression model.' },
            { id: 4, name: 'Evaluation', description: 'Calculate Recall score. Adjust class weights to prioritize churners.' }
        ],
        concepts: [
            { id: 'one_hot_encoding', name: 'One-Hot Encoding', milestone: 1, relationship: 'introduces' },
            { id: 'train_test_split', name: 'Train/Test Split', milestone: 2, relationship: 'introduces' },
            { id: 'logistic_regression', name: 'Logistic Regression', milestone: 3, relationship: 'introduces' },
            { id: 'confusion_matrix', name: 'Confusion Matrix', milestone: 4, relationship: 'introduces' },
            { id: 'recall_precision', name: 'Recall and Precision', milestone: 4, relationship: 'introduces' },
            { id: 'class_imbalance', name: 'Class Imbalance', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_accuracy_king', concept: 'class_imbalance', belief: '73% accuracy means good model', reality: 'Model predicts "Stay" for everyone. 73% of data is "Stay". Zero value. Check Recall.' }
        ]
    },
    {
        id: 'pyds_11_pricing_algorithm',
        sequence_order: 11,
        name: 'The Pricing Algorithm: Predictive Modeling',
        description: 'Develop regression model to predict insurance charges. Diagnose and cure Overfitting using Cross-Validation.',
        estimated_hours: 14,
        dataset: { name: 'Medical Insurance Cost', source: 'Kaggle' },
        milestones: [
            { id: 1, name: 'Baseline', description: 'Train Linear Regression model. Measure Mean Absolute Error (MAE).' },
            { id: 2, name: 'Complexity', description: 'Train Decision Tree. Observe Train vs Test score divergence (Overfitting).' },
            { id: 3, name: 'Tuning', description: 'Use Cross-Validation to find optimal max_depth for tree.' },
            { id: 4, name: 'Interpretation', description: 'Use feature_importances_ to confirm Smoker as dominant predictor.' }
        ],
        concepts: [
            { id: 'linear_regression', name: 'Linear Regression', milestone: 1, relationship: 'introduces' },
            { id: 'mae', name: 'Mean Absolute Error', milestone: 1, relationship: 'introduces' },
            { id: 'decision_tree', name: 'Decision Tree', milestone: 2, relationship: 'introduces' },
            { id: 'overfitting', name: 'Overfitting', milestone: 2, relationship: 'introduces' },
            { id: 'cross_validation', name: 'Cross-Validation', milestone: 3, relationship: 'introduces' },
            { id: 'gridsearchcv', name: 'GridSearchCV', milestone: 3, relationship: 'introduces' },
            { id: 'feature_importances', name: 'Feature Importances', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_train_score', concept: 'overfitting', belief: 'R² of 0.99 on training data is great', reality: 'Test R² drops to 0.70. Model memorized training data. Use Cross-Validation.' }
        ]
    },
    {
        id: 'pyds_12_market_segmenter',
        sequence_order: 12,
        name: 'The Market Segmenter: Unsupervised Clustering',
        description: 'Discover hidden customer segments using K-Means clustering on income and spending data.',
        estimated_hours: 12,
        dataset: { name: 'Mall Customer Segmentation Data', source: 'Kaggle' },
        milestones: [
            { id: 1, name: 'Scaling', description: 'Apply Standard Scaling to normalize Income and Spending Score.' },
            { id: 2, name: 'Optimization', description: 'Use Elbow Method to identify optimal cluster count (likely 5).' },
            { id: 3, name: 'Modeling', description: 'Train K-Means model and assign cluster labels.' },
            { id: 4, name: 'Interpretation', description: 'Visualize clusters and write persona description for each group.' }
        ],
        concepts: [
            { id: 'standard_scaler', name: 'StandardScaler', milestone: 1, relationship: 'introduces' },
            { id: 'kmeans', name: 'K-Means Clustering', milestone: 3, relationship: 'introduces' },
            { id: 'elbow_method', name: 'Elbow Method', milestone: 2, relationship: 'introduces' },
            { id: 'inertia', name: 'Inertia (SSE)', milestone: 2, relationship: 'introduces' },
            { id: 'unsupervised_learning', name: 'Unsupervised Learning', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_k_obvious', concept: 'elbow_method', belief: 'The algorithm knows how many clusters to find', reality: 'K-Means requires user to specify K. Use Elbow Method to find optimal value.' }
        ]
    },

    // =========================================================================
    // TIER 5: Advanced (Engineering Phase) - NLP and Deep Learning
    // =========================================================================
    {
        id: 'pyds_13_disaster_monitor',
        sequence_order: 13,
        name: 'The Disaster Monitor: NLP Text Classification',
        description: 'Build model to distinguish real disaster reports from metaphorical usage. Master TF-IDF and Naive Bayes.',
        estimated_hours: 18,
        dataset: { name: 'NLP with Disaster Tweets', source: 'Kaggle Competition' },
        milestones: [
            { id: 1, name: 'Text Cleaning', description: 'Remove URLs, punctuation, HTML tags using Regex.' },
            { id: 2, name: 'Vectorization', description: 'Convert corpus into TF-IDF Matrix.' },
            { id: 3, name: 'Modeling', description: 'Train Naive Bayes classifier.' },
            { id: 4, name: 'Error Analysis', description: 'Inspect False Positives to understand which words confuse model.' }
        ],
        concepts: [
            { id: 'tokenization', name: 'Tokenization', milestone: 2, relationship: 'introduces' },
            { id: 'tfidf', name: 'TF-IDF Vectorization', milestone: 2, relationship: 'introduces' },
            { id: 'stop_words', name: 'Stop Words', milestone: 2, relationship: 'introduces' },
            { id: 'ngrams', name: 'N-Grams', milestone: 2, relationship: 'introduces' },
            { id: 'naive_bayes', name: 'Naive Bayes', milestone: 3, relationship: 'introduces' },
            { id: 'nlp_pipeline', name: 'NLP Pipeline', milestone: 2, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_text_as_feature', concept: 'tfidf', belief: 'Can feed text directly into model', reality: 'Cannot multiply word "fire" by 5. Must convert text to numerical vectors (TF-IDF).' }
        ]
    },
    {
        id: 'pyds_14_diagnostic_assistant',
        sequence_order: 14,
        name: 'The Diagnostic Assistant: Medical Image Classification (Capstone)',
        description: 'Train CNN to detect Pneumonia from chest X-Rays. Master TensorFlow/Keras and deep learning architecture.',
        estimated_hours: 25,
        dataset: { name: 'Chest X-Ray Images (Pneumonia)', source: 'Kaggle (Paul Mooney)' },
        milestones: [
            { id: 1, name: 'Data Loading', description: 'Use Keras image_dataset_from_directory to load images as tensors.' },
            { id: 2, name: 'Architecture', description: 'Design Sequential CNN with Conv2D and MaxPooling2D layers.' },
            { id: 3, name: 'Training', description: 'Train model using Validation Split to monitor performance.' },
            { id: 4, name: 'Evaluation', description: 'Calculate Recall (Sensitivity) because missing Pneumonia is critical.' }
        ],
        concepts: [
            { id: 'tensors', name: 'Tensors', milestone: 1, relationship: 'introduces' },
            { id: 'image_data_generator', name: 'ImageDataGenerator', milestone: 1, relationship: 'introduces' },
            { id: 'cnn', name: 'Convolutional Neural Network', milestone: 2, relationship: 'introduces' },
            { id: 'conv2d', name: 'Conv2D Layer', milestone: 2, relationship: 'introduces' },
            { id: 'maxpooling', name: 'MaxPooling2D', milestone: 2, relationship: 'introduces' },
            { id: 'flatten_dense', name: 'Flatten and Dense Layers', milestone: 2, relationship: 'introduces' },
            { id: 'loss_curve', name: 'Loss Curve Monitoring', milestone: 3, relationship: 'introduces' },
            { id: 'keras_sequential', name: 'Keras Sequential API', milestone: 2, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_flat_pixels', concept: 'cnn', belief: 'Flatten image pixels and use Random Forest', reality: 'Loses spatial information. CNN preserves that pixel A is next to pixel B. Spatial hierarchy matters.' }
        ]
    }
];

async function seedPythonDataCurriculum() {
    const db = getDatabase();

    console.log('Creating Python Data Science track...');

    db.prepare(`
        INSERT OR REPLACE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        pythonDataTrack.id,
        pythonDataTrack.name,
        pythonDataTrack.description,
        pythonDataTrack.language,
        pythonDataTrack.domain,
        pythonDataTrack.difficulty,
        pythonDataTrack.is_preseeded ? 1 : 0,
        pythonDataTrack.created_by
    );

    console.log(`Created track: ${pythonDataTrack.name}`);

    let templatesCreated = 0;
    let conceptsCreated = 0;
    let misconceptionsCreated = 0;

    for (const project of projectTemplates) {
        db.prepare(`
            INSERT OR REPLACE INTO project_template (id, track_id, sequence_order, name, description, estimated_hours, milestones)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            project.id,
            pythonDataTrack.id,
            project.sequence_order,
            project.name,
            project.description,
            project.estimated_hours,
            toJson(project.milestones)
        );
        templatesCreated++;

        for (const concept of project.concepts) {
            db.prepare(`
                INSERT OR REPLACE INTO concept (id, name, category)
                VALUES (?, ?, ?)
            `).run(concept.id, concept.name, 'Python Data Science');

            db.prepare(`
                INSERT OR IGNORE INTO milestone_concept (project_template_id, milestone_number, concept_id, relationship)
                VALUES (?, ?, ?, ?)
            `).run(project.id, concept.milestone, concept.id, concept.relationship);

            conceptsCreated++;
        }

        for (const misc of project.misconceptions) {
            db.prepare(`
                INSERT OR REPLACE INTO misconception (id, concept_id, name, description, remediation_strategy)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                misc.id,
                misc.concept,
                misc.belief.substring(0, 100),
                misc.belief,
                misc.reality
            );
            misconceptionsCreated++;
        }
    }

    console.log(`Created ${templatesCreated} project templates`);
    console.log(`Created ${conceptsCreated} concepts`);
    console.log(`Created ${misconceptionsCreated} misconceptions`);
    console.log('\nPython Data Science curriculum seeding complete!');
}

seedPythonDataCurriculum().catch(console.error);
