/**
 * ML Engineering Curriculum Seeder
 * "From Perceptron to Production" - 15 projects, 5 tiers
 * Source: Designing an ML Curriculum.md
 */

import { getDatabase, generateId, toJson } from '../src/server/db/index.js';

const mlEngTrack = {
    id: 'ml-engineering',
    name: 'ML Engineering: Perceptron to Production',
    description: '15 projects from Regression Ethics to MLOps. Master Supervised Learning, Ensembles, Unsupervised Learning, Deep Learning, and Production Engineering through Productive Failure pedagogy.',
    language: 'python',
    domain: 'machine-learning',
    difficulty: 'intermediate',
    is_preseeded: true,
    created_by: 'system'
};

const projectTemplates = [
    // =========================================================================
    // TIER 1: Supervised Learning and the Data Lifecycle
    // =========================================================================
    {
        id: 'mle_01_housing_regression',
        sequence_order: 1,
        name: 'Residential Value Estimation (Regression and Ethics)',
        description: 'Build regression model using Ames Housing Dataset (NOT Boston—ethical rejection). Learn log-transformation, gradient descent, and multicollinearity.',
        estimated_hours: 12,
        dataset: { name: 'Ames Housing Dataset', source: 'Kaggle (Dean De Cock)' },
        milestones: [
            { id: 1, name: 'SANDBOX: The Jumping Gradient', description: 'Implement gradient descent from scratch with learning rate α=1.0. Observe divergence.', type: 'sandbox' },
            { id: 2, name: 'Baseline Model', description: 'Fit Linear Regression to raw Ames data. Observe poor performance (high MSE).' },
            { id: 3, name: 'Log Transformation', description: 'Apply log transform to skewed features and target. Re-fit model.' },
            { id: 4, name: 'Multicollinearity Analysis', description: 'Compute VIF for correlated features (GarageCars, GarageArea). Remove redundancy.' }
        ],
        concepts: [
            { id: 'linear_regression_ml', name: 'Linear Regression', milestone: 2, relationship: 'introduces' },
            { id: 'gradient_descent', name: 'Gradient Descent', milestone: 1, relationship: 'introduces' },
            { id: 'learning_rate', name: 'Learning Rate', milestone: 1, relationship: 'introduces' },
            { id: 'log_transformation_ml', name: 'Log Transformation', milestone: 3, relationship: 'introduces' },
            { id: 'vif', name: 'Variance Inflation Factor (VIF)', milestone: 4, relationship: 'introduces' },
            { id: 'multicollinearity', name: 'Multicollinearity', milestone: 4, relationship: 'introduces' },
            { id: 'ethical_data_boston', name: 'Ethical Data Selection', milestone: 1, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_correlation_causation_ml', concept: 'linear_regression_ml', belief: 'High regression coefficient means causal driver', reality: 'Correlation ≠ causation. GarageArea correlates with price but does not cause it.' },
            { id: 'mis_more_features_better', concept: 'multicollinearity', belief: 'More features always improve the model', reality: 'Correlated features cause unstable coefficients with high variance.' }
        ]
    },
    {
        id: 'mle_02_titanic_classification',
        sequence_order: 2,
        name: 'Titanic Survival Prediction (Classification and Leakage)',
        description: 'Binary classification with focus on data leakage detection and proper imputation pipelines.',
        estimated_hours: 10,
        dataset: { name: 'Titanic Dataset', source: 'Kaggle Competition' },
        milestones: [
            { id: 1, name: 'The Perfect Model Trap', description: 'Include Body ID column. Achieve 100% accuracy. Diagnose target leakage.' },
            { id: 2, name: 'SANDBOX: The Imputation Trap', description: 'Impute missing age using global mean before split. Detect contamination.', type: 'sandbox' },
            { id: 3, name: 'Pipeline Construction', description: 'Build Scikit-Learn Pipeline with proper train-only fitting.' },
            { id: 4, name: 'Metric Selection', description: 'Compare Accuracy, Precision, Recall, F1 on imbalanced survival data.' }
        ],
        concepts: [
            { id: 'target_leakage', name: 'Target Leakage', milestone: 1, relationship: 'introduces' },
            { id: 'data_leakage', name: 'Data Leakage', milestone: 2, relationship: 'introduces' },
            { id: 'sklearn_pipeline', name: 'Scikit-Learn Pipelines', milestone: 3, relationship: 'introduces' },
            { id: 'accuracy_paradox', name: 'Accuracy Paradox', milestone: 4, relationship: 'introduces' },
            { id: 'precision_ml', name: 'Precision', milestone: 4, relationship: 'introduces' },
            { id: 'recall_ml', name: 'Recall', milestone: 4, relationship: 'introduces' },
            { id: 'f1_score', name: 'F1 Score', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_body_id_ok', concept: 'target_leakage', belief: 'Using all available columns is fine', reality: 'Body ID only assigned after death. Knowing it perfectly predicts mortality. Future leakage.' },
            { id: 'mis_impute_then_split', concept: 'data_leakage', belief: 'Impute missing values, then split data', reality: 'Statistics must be calculated on Train and applied to Test. Pipeline order matters.' }
        ]
    },
    {
        id: 'mle_03_sentiment_nlp',
        sequence_order: 3,
        name: 'Sentiment Analysis of Movie Reviews (NLP Foundations)',
        description: 'Build sentiment classifier using Bag of Words approach. Compare Naive Bayes vs Logistic Regression.',
        estimated_hours: 12,
        dataset: { name: 'IMDB Reviews', source: 'Kaggle / Stanford' },
        milestones: [
            { id: 1, name: 'The Vectorization Bottleneck', description: 'Attempt manual word counting with loops on 50k reviews. Experience slowness.' },
            { id: 2, name: 'CountVectorizer', description: 'Switch to Scikit-Learn CountVectorizer. Experience speedup.' },
            { id: 3, name: 'Naive Bayes from Scratch', description: 'Implement Naive Bayes to understand Bayes Theorem and independence assumption.' },
            { id: 4, name: 'Logistic vs Naive Bayes', description: 'Compare discriminative vs generative models.' }
        ],
        concepts: [
            { id: 'bag_of_words', name: 'Bag of Words', milestone: 1, relationship: 'introduces' },
            { id: 'count_vectorizer', name: 'CountVectorizer', milestone: 2, relationship: 'introduces' },
            { id: 'vectorization_ml', name: 'Vectorization (Computational)', milestone: 2, relationship: 'introduces' },
            { id: 'naive_bayes_ml', name: 'Naive Bayes', milestone: 3, relationship: 'introduces' },
            { id: 'bayes_theorem', name: 'Bayes Theorem', milestone: 3, relationship: 'introduces' },
            { id: 'discriminative_vs_generative', name: 'Discriminative vs Generative', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_logistic_for_regression', concept: 'naive_bayes_ml', belief: 'Logistic Regression is for regression', reality: 'It is classification. Sigmoid outputs probabilities. Name is misleading.' },
            { id: 'mis_features_independent', concept: 'naive_bayes_ml', belief: 'Naive Bayes assumes features are truly independent', reality: 'Empirically false (New/York), but computationally efficient. "Naive" is deliberate.' }
        ]
    },

    // =========================================================================
    // TIER 2: Model Mastery and Evaluation Nuance
    // =========================================================================
    {
        id: 'mle_04_semiconductor_ensembles',
        sequence_order: 4,
        name: 'Semiconductor Fault Detection (Ensembles and Trees)',
        description: 'Compare Decision Trees, Random Forests, and Gradient Boosting on complex non-linear boundaries.',
        estimated_hours: 14,
        dataset: { name: 'SECOM Semiconductor', source: 'UCI ML Repository' },
        milestones: [
            { id: 1, name: 'The Overfitted Tree', description: 'Train Decision Tree with max_depth=None. Observe 100% train accuracy, poor test.' },
            { id: 2, name: 'SANDBOX: Entropy Calculation', description: 'Calculate Shannon Entropy and Information Gain by hand on Play Tennis dataset.', type: 'sandbox' },
            { id: 3, name: 'Pruning and Hyperparameters', description: 'Apply min_samples_leaf regularization. Observe improved generalization.' },
            { id: 4, name: 'Random Forest vs Gradient Boosting', description: 'Compare Bagging (RF) vs Boosting (XGBoost). Understand variance/bias tradeoff.' }
        ],
        concepts: [
            { id: 'decision_tree_ml', name: 'Decision Tree', milestone: 1, relationship: 'introduces' },
            { id: 'overfitting_ml', name: 'Overfitting', milestone: 1, relationship: 'introduces' },
            { id: 'shannon_entropy', name: 'Shannon Entropy', milestone: 2, relationship: 'introduces' },
            { id: 'information_gain', name: 'Information Gain', milestone: 2, relationship: 'introduces' },
            { id: 'pruning', name: 'Pruning', milestone: 3, relationship: 'introduces' },
            { id: 'random_forest_ml', name: 'Random Forest', milestone: 4, relationship: 'introduces' },
            { id: 'gradient_boosting', name: 'Gradient Boosting', milestone: 4, relationship: 'introduces' },
            { id: 'bagging_vs_boosting', name: 'Bagging vs Boosting', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_rf_no_overfit', concept: 'random_forest_ml', belief: 'Random Forests cannot overfit', reality: 'They can overfit on noisy data if trees are too deep and correlated. Robust, not immune.' }
        ]
    },
    {
        id: 'mle_05_churn_imbalanced',
        sequence_order: 5,
        name: 'Telecom Customer Churn (Imbalanced Data)',
        description: 'Handle severe class imbalance (95%/5%). Learn SMOTE pitfalls and cost-sensitive learning.',
        estimated_hours: 12,
        dataset: { name: 'Telco Customer Churn', source: 'Kaggle (IBM)' },
        milestones: [
            { id: 1, name: 'The SMOTE Illusion', description: 'Apply SMOTE before train/test split. Observe leakage via synthetic point contamination.' },
            { id: 2, name: 'Cost-Sensitive Learning', description: 'Use class_weight parameter instead of SMOTE. Punish missing churners.' },
            { id: 3, name: 'Threshold Tuning', description: 'Adjust classification threshold based on business cost of FP vs FN.' },
            { id: 4, name: 'PR-AUC vs ROC-AUC', description: 'Understand when Precision-Recall curve is more informative than ROC.' }
        ],
        concepts: [
            { id: 'class_imbalance_ml', name: 'Class Imbalance', milestone: 1, relationship: 'introduces' },
            { id: 'smote', name: 'SMOTE', milestone: 1, relationship: 'introduces' },
            { id: 'cost_sensitive_learning', name: 'Cost-Sensitive Learning', milestone: 2, relationship: 'introduces' },
            { id: 'classification_threshold', name: 'Classification Threshold', milestone: 3, relationship: 'introduces' },
            { id: 'pr_auc', name: 'PR-AUC', milestone: 4, relationship: 'introduces' },
            { id: 'roc_auc', name: 'ROC-AUC', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_smote_before_split', concept: 'smote', belief: 'Apply SMOTE to entire dataset for balance', reality: 'Synthetic points in validation set are based on training neighbors. Data leakage.' }
        ]
    },
    {
        id: 'mle_06_energy_timeseries',
        sequence_order: 6,
        name: 'Energy Consumption Forecasting (Time-Series)',
        description: 'Predict future energy usage. Learn time-series validation and stationarity.',
        estimated_hours: 14,
        dataset: { name: 'Individual Household Electric Power', source: 'UCI ML Repository' },
        milestones: [
            { id: 1, name: 'The Time-Travel Cross-Validation', description: 'Use K-Fold with shuffling on time-series. Observe look-ahead bias.' },
            { id: 2, name: 'Walk-Forward Validation', description: 'Implement TimeSeriesSplit. Train always precedes validation in time.' },
            { id: 3, name: 'Stationarity Testing', description: 'Apply Dickey-Fuller test. Observe model failure when mean/variance changes.' },
            { id: 4, name: 'Differencing', description: 'Apply y\'_t = y_t - y_{t-1} to achieve stationarity.' }
        ],
        concepts: [
            { id: 'time_series', name: 'Time Series', milestone: 1, relationship: 'introduces' },
            { id: 'look_ahead_bias', name: 'Look-Ahead Bias', milestone: 1, relationship: 'introduces' },
            { id: 'walk_forward_validation', name: 'Walk-Forward Validation', milestone: 2, relationship: 'introduces' },
            { id: 'stationarity', name: 'Stationarity', milestone: 3, relationship: 'introduces' },
            { id: 'differencing', name: 'Differencing', milestone: 4, relationship: 'introduces' },
            { id: 'dickey_fuller', name: 'Dickey-Fuller Test', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_shuffle_ts', concept: 'look_ahead_bias', belief: 'Random shuffle is always safe for cross-validation', reality: 'In time-series, shuffling lets model train on tomorrow to predict today.' }
        ]
    },

    // =========================================================================
    // TIER 3: Unsupervised Learning and Dimensionality Reduction
    // =========================================================================
    {
        id: 'mle_07_customer_clustering',
        sequence_order: 7,
        name: 'Customer Segmentation (Clustering)',
        description: 'Segment customer base using K-Means and Hierarchical clustering. Understand distance metrics.',
        estimated_hours: 12,
        dataset: { name: 'Mall Customer Segmentation', source: 'Kaggle' },
        milestones: [
            { id: 1, name: 'The Scaling Oversight', description: 'Apply K-Means to raw data. Income dominates, Age ignored.' },
            { id: 2, name: 'Standardization', description: 'Apply Z-score normalization. Observe balanced clustering.' },
            { id: 3, name: 'SANDBOX: The K-Means Donut', description: 'Apply K-Means to ring-shaped data. Observe linear slicing failure.', type: 'sandbox' },
            { id: 4, name: 'DBSCAN', description: 'Apply density-based clustering to capture non-convex manifolds.' }
        ],
        concepts: [
            { id: 'kmeans_ml', name: 'K-Means Clustering', milestone: 1, relationship: 'introduces' },
            { id: 'euclidean_distance', name: 'Euclidean Distance', milestone: 1, relationship: 'introduces' },
            { id: 'standardization_ml', name: 'Standardization (Z-score)', milestone: 2, relationship: 'introduces' },
            { id: 'dbscan', name: 'DBSCAN', milestone: 4, relationship: 'introduces' },
            { id: 'convex_clusters', name: 'Convex vs Non-Convex Clusters', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_kmeans_any_shape', concept: 'kmeans_ml', belief: 'K-Means works on any cluster shape', reality: 'K-Means assumes spherical, convex clusters. Cannot model rings or arbitrary manifolds.' }
        ]
    },
    {
        id: 'mle_08_genomics_dimred',
        sequence_order: 8,
        name: 'Genomics Visualization (Dimensionality Reduction)',
        description: 'Visualize high-dimensional gene expression data. Compare PCA, t-SNE, and UMAP.',
        estimated_hours: 10,
        dataset: { name: 'Gene Expression Cancer RNA-Seq', source: 'UCI ML Repository' },
        milestones: [
            { id: 1, name: 'PCA Fundamentals', description: 'Apply PCA. Understand eigenvectors of covariance matrix.' },
            { id: 2, name: 'The t-SNE Misinterpretation', description: 'Interpret distance between clusters as similarity. Learn it only preserves local structure.' },
            { id: 3, name: 'UMAP Comparison', description: 'Compare UMAP speed and global structure preservation vs t-SNE.' },
            { id: 4, name: 'SANDBOX: The Eigen-Visualizer', description: 'Plot eigenvectors of 2D Gaussian. Stretch distribution and observe alignment.', type: 'sandbox' }
        ],
        concepts: [
            { id: 'pca_ml', name: 'Principal Component Analysis', milestone: 1, relationship: 'introduces' },
            { id: 'eigenvectors', name: 'Eigenvectors', milestone: 1, relationship: 'introduces' },
            { id: 'eigenvalues', name: 'Eigenvalues', milestone: 1, relationship: 'introduces' },
            { id: 'covariance_matrix', name: 'Covariance Matrix', milestone: 1, relationship: 'introduces' },
            { id: 'tsne', name: 't-SNE', milestone: 2, relationship: 'introduces' },
            { id: 'umap', name: 'UMAP', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_pca_selects_features', concept: 'pca_ml', belief: 'PCA keeps the most important features', reality: 'PCA creates NEW features (linear combinations). Original interpretability is lost.' },
            { id: 'mis_tsne_global', concept: 'tsne', belief: 't-SNE preserves global distances', reality: 'Only preserves local neighborhoods. Distance between far clusters is meaningless.' }
        ]
    },
    {
        id: 'mle_09_recommender',
        sequence_order: 9,
        name: 'Movie Recommender System (Matrix Factorization)',
        description: 'Build collaborative filtering system using matrix factorization and SVD.',
        estimated_hours: 12,
        dataset: { name: 'MovieLens', source: 'GroupLens Research' },
        milestones: [
            { id: 1, name: 'User-Item Matrix', description: 'Construct sparse rating matrix. Understand sparsity challenge.' },
            { id: 2, name: 'SVD Decomposition', description: 'Apply truncated SVD. Understand latent factors (genre, tone).' },
            { id: 3, name: 'Matrix Rank', description: 'Understand rank as number of latent concepts driving preferences.' },
            { id: 4, name: 'Cold Start Problem', description: 'Address new users/items with no history.' }
        ],
        concepts: [
            { id: 'collaborative_filtering', name: 'Collaborative Filtering', milestone: 1, relationship: 'introduces' },
            { id: 'matrix_factorization', name: 'Matrix Factorization', milestone: 2, relationship: 'introduces' },
            { id: 'svd', name: 'Singular Value Decomposition', milestone: 2, relationship: 'introduces' },
            { id: 'matrix_rank', name: 'Matrix Rank', milestone: 3, relationship: 'introduces' },
            { id: 'cold_start', name: 'Cold Start Problem', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: []
    },

    // =========================================================================
    // TIER 4: Deep Learning and Architecture
    // =========================================================================
    {
        id: 'mle_10_nn_from_scratch',
        sequence_order: 10,
        name: 'Neural Network from Scratch (NumPy Only)',
        description: 'Build MLP for digit classification using only NumPy. No autograd.',
        estimated_hours: 20,
        dataset: { name: 'MNIST Digits', source: 'Yann LeCun' },
        milestones: [
            { id: 1, name: 'Forward Pass', description: 'Implement matrix multiplications and activation functions.' },
            { id: 2, name: 'Backpropagation', description: 'Implement chain rule manually. Compute gradients layer by layer.' },
            { id: 3, name: 'SANDBOX: The Vanishing Gradient', description: 'Use deep network with Sigmoid. Observe early layers stop updating.', type: 'sandbox' },
            { id: 4, name: 'ReLU Activation', description: 'Replace Sigmoid with ReLU. Observe faster training.' }
        ],
        concepts: [
            { id: 'mlp', name: 'Multi-Layer Perceptron', milestone: 1, relationship: 'introduces' },
            { id: 'forward_pass', name: 'Forward Pass', milestone: 1, relationship: 'introduces' },
            { id: 'backpropagation', name: 'Backpropagation', milestone: 2, relationship: 'introduces' },
            { id: 'chain_rule', name: 'Chain Rule (Calculus)', milestone: 2, relationship: 'introduces' },
            { id: 'vanishing_gradient', name: 'Vanishing Gradient', milestone: 3, relationship: 'introduces' },
            { id: 'relu', name: 'ReLU Activation', milestone: 4, relationship: 'introduces' },
            { id: 'sigmoid', name: 'Sigmoid Activation', milestone: 3, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_dying_relu', concept: 'vanishing_gradient', belief: 'Neurons die due to vanishing gradients', reality: 'Dying ReLU is caused by negative weights pushing activations to 0. Vanishing gradient is small derivatives in deep chains.' }
        ]
    },
    {
        id: 'mle_11_fashion_cnn',
        sequence_order: 11,
        name: 'Fashion-MNIST Classification (CNNs)',
        description: 'Build CNN for image classification. Understand convolution, pooling, and dropout.',
        estimated_hours: 16,
        dataset: { name: 'Fashion-MNIST', source: 'Zalando Research' },
        milestones: [
            { id: 1, name: 'SANDBOX: Manual Convolution', description: 'Calculate 3x3 Sobel kernel output by hand. Understand stride and padding.', type: 'sandbox' },
            { id: 2, name: 'Conv2D and MaxPooling', description: 'Build convolutional layers for spatial feature extraction.' },
            { id: 3, name: 'Dropout Regularization', description: 'Apply dropout during training only. Understand co-adaptation prevention.' },
            { id: 4, name: 'Batch Normalization', description: 'Apply BatchNorm to stabilize training and allow higher learning rates.' }
        ],
        concepts: [
            { id: 'cnn_ml', name: 'Convolutional Neural Network', milestone: 2, relationship: 'introduces' },
            { id: 'convolution', name: 'Convolution Operation', milestone: 1, relationship: 'introduces' },
            { id: 'stride_padding', name: 'Stride and Padding', milestone: 1, relationship: 'introduces' },
            { id: 'maxpooling_ml', name: 'MaxPooling', milestone: 2, relationship: 'introduces' },
            { id: 'dropout_ml', name: 'Dropout', milestone: 3, relationship: 'introduces' },
            { id: 'batch_normalization', name: 'Batch Normalization', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_pooling_adds', concept: 'maxpooling_ml', belief: 'Pooling layers add information', reality: 'Pooling REMOVES spatial resolution for translation invariance and parameter reduction.' },
            { id: 'mis_dropout_inference', concept: 'dropout_ml', belief: 'Dropout is used during training and inference', reality: 'Dropout is training-only. Inference uses all neurons with scaled weights.' }
        ]
    },
    {
        id: 'mle_12_transformer_nmt',
        sequence_order: 12,
        name: 'Neural Machine Translation (Transformers)',
        description: 'Build small Transformer for sequence-to-sequence tasks. Understand self-attention.',
        estimated_hours: 20,
        dataset: { name: 'English-French Translation', source: 'TensorFlow Datasets' },
        milestones: [
            { id: 1, name: 'Self-Attention Mechanics', description: 'Implement QKV attention. Understand similarity via dot product.' },
            { id: 2, name: 'Multi-Head Attention', description: 'Parallelize attention across multiple heads for different representations.' },
            { id: 3, name: 'Positional Encoding', description: 'Add positional information since Transformers have no inherent sequence order.' },
            { id: 4, name: 'Stochastic Parrots Discussion', description: 'Analyze LLM limitations: statistical engines without grounding in meaning.' }
        ],
        concepts: [
            { id: 'transformer', name: 'Transformer Architecture', milestone: 1, relationship: 'introduces' },
            { id: 'self_attention', name: 'Self-Attention', milestone: 1, relationship: 'introduces' },
            { id: 'qkv', name: 'Query-Key-Value', milestone: 1, relationship: 'introduces' },
            { id: 'multi_head_attention', name: 'Multi-Head Attention', milestone: 2, relationship: 'introduces' },
            { id: 'positional_encoding', name: 'Positional Encoding', milestone: 3, relationship: 'introduces' },
            { id: 'stochastic_parrots', name: 'Stochastic Parrots', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_transformer_vanishing', concept: 'transformer', belief: 'Transformers suffer from vanishing gradients like RNNs', reality: 'Transformers have direct connections between all tokens. No sequential path for gradient decay.' }
        ]
    },

    // =========================================================================
    // TIER 5: Production Engineering and MLOps
    // =========================================================================
    {
        id: 'mle_13_deployment',
        sequence_order: 13,
        name: 'Model Deployment (FastAPI and Docker)',
        description: 'Serve Churn Prediction model as REST API. Master containerization.',
        estimated_hours: 14,
        dataset: { name: 'Churn Model Artifact', source: 'Project 5 Output' },
        milestones: [
            { id: 1, name: 'FastAPI Endpoint', description: 'Create /predict endpoint with type validation and Swagger UI.' },
            { id: 2, name: 'Dockerfile', description: 'Containerize application with OS, Python libs, and model artifact.' },
            { id: 3, name: 'Docker Compose', description: 'Orchestrate multi-container setup with database and API.' },
            { id: 4, name: 'CI/CD Pipeline', description: 'Automate testing and deployment with GitHub Actions.' }
        ],
        concepts: [
            { id: 'fastapi', name: 'FastAPI', milestone: 1, relationship: 'introduces' },
            { id: 'rest_api_ml', name: 'REST API', milestone: 1, relationship: 'introduces' },
            { id: 'docker_ml', name: 'Docker', milestone: 2, relationship: 'introduces' },
            { id: 'containerization', name: 'Containerization', milestone: 2, relationship: 'introduces' },
            { id: 'docker_compose', name: 'Docker Compose', milestone: 3, relationship: 'introduces' },
            { id: 'ci_cd', name: 'CI/CD Pipeline', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_works_on_my_machine', concept: 'docker_ml', belief: 'If it works locally, it works in production', reality: 'Dependency conflicts between dev and prod environments. Docker solves this.' }
        ]
    },
    {
        id: 'mle_14_monitoring_drift',
        sequence_order: 14,
        name: 'Monitoring and Drift Detection',
        description: 'Detect data drift and concept drift in production. Build monitoring dashboard.',
        estimated_hours: 16,
        dataset: { name: 'Simulated Production Data', source: 'Synthetic with Drift' },
        milestones: [
            { id: 1, name: 'Data Drift Detection', description: 'Apply Kolmogorov-Smirnov test to detect P(X) changes.' },
            { id: 2, name: 'Concept Drift Detection', description: 'Detect P(Y|X) changes when behavior shifts.' },
            { id: 3, name: 'The Catastrophic Forgetting Trap', description: 'Retrain on new batch only. Observe forgetting of core user base.' },
            { id: 4, name: 'Monitoring Dashboard', description: 'Build Streamlit dashboard with Evidently AI integration.' }
        ],
        concepts: [
            { id: 'data_drift', name: 'Data Drift (Covariate Shift)', milestone: 1, relationship: 'introduces' },
            { id: 'concept_drift', name: 'Concept Drift', milestone: 2, relationship: 'introduces' },
            { id: 'ks_test', name: 'Kolmogorov-Smirnov Test', milestone: 1, relationship: 'introduces' },
            { id: 'catastrophic_forgetting', name: 'Catastrophic Forgetting', milestone: 3, relationship: 'introduces' },
            { id: 'evidently_ai', name: 'Evidently AI', milestone: 4, relationship: 'introduces' },
            { id: 'streamlit_ml', name: 'Streamlit Dashboard', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: [
            { id: 'mis_retrain_immediately', concept: 'catastrophic_forgetting', belief: 'Retrain immediately upon drift', reality: 'Blind retraining causes forgetting or feedback loops. Mix old and new data.' }
        ]
    },
    {
        id: 'mle_15_ab_testing_fairness',
        sequence_order: 15,
        name: 'A/B Testing and Shadow Deployment',
        description: 'Safely roll out model updates. Audit for fairness and bias.',
        estimated_hours: 14,
        dataset: { name: 'Production A/B Data', source: 'Synthetic' },
        milestones: [
            { id: 1, name: 'Shadow Mode Deployment', description: 'Run new model in shadow. Log predictions without returning to user.' },
            { id: 2, name: 'Statistical Significance', description: 'Calculate sample size needed for reliable A/B test.' },
            { id: 3, name: 'Disparate Impact Audit', description: 'Calculate DI ratio. Apply 80% rule for bias detection.' },
            { id: 4, name: 'Bias Mitigation', description: 'Use AIF360/Fairlearn for re-weighing or threshold adjustment.' }
        ],
        concepts: [
            { id: 'shadow_deployment', name: 'Shadow Deployment', milestone: 1, relationship: 'introduces' },
            { id: 'ab_testing_ml', name: 'A/B Testing (ML)', milestone: 2, relationship: 'introduces' },
            { id: 'statistical_significance', name: 'Statistical Significance', milestone: 2, relationship: 'introduces' },
            { id: 'disparate_impact', name: 'Disparate Impact', milestone: 3, relationship: 'introduces' },
            { id: 'fairness_ml', name: 'Fairness in ML', milestone: 3, relationship: 'introduces' },
            { id: 'aif360', name: 'AIF360', milestone: 4, relationship: 'introduces' },
            { id: 'fairlearn', name: 'Fairlearn', milestone: 4, relationship: 'introduces' }
        ],
        misconceptions: []
    }
];

async function seedMLEngCurriculum() {
    const db = getDatabase();

    console.log('Creating ML Engineering track...');

    db.prepare(`
        INSERT OR REPLACE INTO learning_track (id, name, description, language, domain, difficulty, is_preseeded, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        mlEngTrack.id,
        mlEngTrack.name,
        mlEngTrack.description,
        mlEngTrack.language,
        mlEngTrack.domain,
        mlEngTrack.difficulty,
        mlEngTrack.is_preseeded ? 1 : 0,
        mlEngTrack.created_by
    );

    console.log(`Created track: ${mlEngTrack.name}`);

    let templatesCreated = 0;
    let conceptsCreated = 0;
    let misconceptionsCreated = 0;

    for (const project of projectTemplates) {
        db.prepare(`
            INSERT OR REPLACE INTO project_template (id, track_id, sequence_order, name, description, estimated_hours, milestones)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            project.id,
            mlEngTrack.id,
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
            `).run(concept.id, concept.name, 'ML Engineering');

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
    console.log('\nML Engineering curriculum seeding complete!');
}

seedMLEngCurriculum().catch(console.error);
