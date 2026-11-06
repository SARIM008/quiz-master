import SummaryPage from './SummaryPage.js';

export default {
    template: `
    <div class="min-vh-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <!-- Navbar -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-lg">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold text-primary" href="#">
                    <i class="fas fa-graduation-cap me-2"></i>Quiz Master
                </a>
                
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <a class="nav-link" 
                               :class="{ active: activeSection === 'dashboard' }"
                               @click="activeSection = 'dashboard'" href="#">
                                <i class="fas fa-home me-1"></i>Dashboard
                            </a>
                        </li>
                        
                        <li class="nav-item">
                            <a class="nav-link" 
                               :class="{ active: activeSection === 'summary' }"
                               @click="activeSection = 'summary'" href="#">
                                <i class="fas fa-chart-pie me-1"></i>Summary
                            </a>
                        </li>
                    </ul>
                    
                    <!-- Search Bar -->
                    <div class="d-flex me-3">
                        <div class="input-group">
                            <input v-model="searchQuery" @keyup.enter="searchQuizzes" 
                                   class="form-control" type="search" placeholder="Search quizzes..." 
                                   style="width: 250px;">
                            <button class="btn btn-outline-light" @click="searchQuizzes">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Export CSV Button -->
                    <div class="me-3">
                        <button class="btn btn-outline-success" @click="exportCSV" :disabled="csvExporting">
                            <span v-if="csvExporting" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="fas fa-download me-1"></i>
                            {{ csvExporting ? 'Generating...' : 'Export CSV' }}
                        </button>
                    </div>
                    
                    <!-- User Info -->
                    <div class="navbar-text text-light me-3">
                        <i class="fas fa-user-circle me-1"></i>
                        Welcome, <strong>{{ userProfile.full_name || 'User' }}</strong>
                        <button class="btn btn-sm btn-outline-light ms-2" @click="openProfileModal">
                            Edit<i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <a class="nav-link text-white" href="#" @click.prevent="logout">Logout</a>
                   
                </div>
            </div>
        </nav>



        <!-- Main Content -->
        <div class="container-fluid py-4">
            <!-- Dashboard Section -->
            <div v-if="activeSection === 'dashboard'">
                <!-- Quick Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="card bg-primary text-white h-100 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">Total Attempts</h6>
                                        <h3 class="mb-0">{{ userStats.total_attempts || 0 }}</h3>
                                    </div>
                                    <i class="fas fa-clipboard-check fa-2x opacity-75"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card bg-success text-white h-100 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">Average Score</h6>
                                        <h3 class="mb-0">{{ userStats.average_score || 0 }}%</h3>
                                    </div>
                                    <i class="fas fa-trophy fa-2x opacity-75"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card bg-warning text-white h-100 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">Available Quizzes</h6>
                                        <h3 class="mb-0">{{ availableQuizzes.length }}</h3>
                                    </div>
                                    <i class="fas fa-book fa-2x opacity-75"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card bg-info text-white h-100 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">This Month</h6>
                                        <h3 class="mb-0">{{ getThisMonthAttempts() }}</h3>
                                    </div>
                                    <i class="fas fa-calendar fa-2x opacity-75"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Debug Info -->
                <div class="row mb-4" v-if="debugMode">
                    <div class="col-12">
                        <div class="alert alert-info">
                            <h6>Debug Information:</h6>
                            <p><strong>Loading:</strong> {{ loading }}</p>
                            <p><strong>Available Quizzes Count:</strong> {{ availableQuizzes.length }}</p>
                            <p><strong>Filtered Quizzes Count:</strong> {{ filteredQuizzes.length }}</p>
                            <p><strong>Selected Subject:</strong> {{ selectedSubject }}</p>
                            <p><strong>Search Query:</strong> {{ searchQuery }}</p>
                            <p><strong>Unique Subjects:</strong> {{ uniqueSubjects.join(', ') }}</p>
                            <button class="btn btn-sm btn-secondary" @click="console.log('Available Quizzes:', availableQuizzes)">Log Quizzes</button>
                        </div>
                    </div>
                </div>

                <!-- Filter Buttons -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title mb-3">
                                    <i class="fas fa-filter me-2"></i>Filter Quizzes
                                </h5>
                                <div class="btn-group mb-3" role="group">
                                    <button type="button" class="btn" 
                                            :class="selectedSubject === 'all' ? 'btn-primary' : 'btn-outline-primary'"
                                            @click="filterBySubject('all')">
                                        All Subjects
                                    </button>
                                    <button v-for="subject in uniqueSubjects" :key="subject"
                                            type="button" class="btn"
                                            :class="selectedSubject === subject ? 'btn-primary' : 'btn-outline-primary'"
                                            @click="filterBySubject(subject)">
                                        {{ subject }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quiz Cards -->
                <div class="row">
                    <div v-if="loading" class="col-12 text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading quizzes...</p>
                    </div>
                    
                    <div v-else-if="filteredQuizzes.length === 0 && availableQuizzes.length === 0" class="col-12 text-center">
                        <div class="card bg-light">
                            <div class="card-body py-5">
                                <i class="fas fa-database fa-3x text-muted mb-3"></i>
                                <h4 class="text-muted">No quizzes available</h4>
                                <p class="text-muted">There are no quizzes in the system yet.</p>
                                <button class="btn btn-primary" @click="debugMode = !debugMode">
                                    {{ debugMode ? 'Hide' : 'Show' }} Debug Info
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else-if="filteredQuizzes.length === 0" class="col-12 text-center">
                        <div class="card bg-light">
                            <div class="card-body py-5">
                                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                                <h4 class="text-muted">No quizzes found</h4>
                                <p class="text-muted">Try changing your filter or search terms</p>
                                <button class="btn btn-secondary" @click="clearFilters">Clear Filters</button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else v-for="quiz in filteredQuizzes" :key="quiz.quiz_id" class="col-lg-4 col-md-6 mb-4">
                        <div class="card h-100 shadow-sm quiz-card" style="transition: transform 0.2s ease-in-out;">
                            <div class="card-header bg-gradient d-flex justify-content-between align-items-center"
                                 :style="'background: linear-gradient(45deg, ' + getSubjectColor(quiz.subject_name) + ', ' + darkenColor(getSubjectColor(quiz.subject_name)) + ');'">
                                <h6 class="text-white mb-0 fw-bold">{{ quiz.subject_name }}</h6>
                                <span class="badge bg-light text-dark">{{ quiz.question_count }} Questions</span>
                            </div>
                            
                            <div class="card-body">
                                <h5 class="card-title text-primary">{{ quiz.chapter_name }}</h5>
                                
                                <div class="row text-center mb-3">
                                    <div class="col-6">
                                        <i class="fas fa-clock text-warning"></i>
                                        <small class="d-block">Duration</small>
                                        <strong>{{ quiz.time_duration }}</strong>
                                    </div>
                                    <div class="col-6">
                                        <i class="fas fa-star text-success"></i>
                                        <small class="d-block">Best Score</small>
                                        <strong>{{ quiz.user_best_score }}/{{ quiz.question_count }}</strong>
                                    </div>
                                </div>
                                
                                <div v-if="quiz.user_attempts > 0" class="alert alert-info alert-sm mb-3">
                                    <i class="fas fa-info-circle me-1"></i>
                                    Attempted {{ quiz.user_attempts }} time(s)
                                </div>
                                
                                <p v-if="quiz.remarks" class="card-text text-muted small">
                                    <i class="fas fa-quote-left"></i> {{ quiz.remarks }}
                                </p>
                            </div>
                            
                            <div class="card-footer bg-transparent">
                                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button class="btn btn-outline-primary btn-sm" @click="viewQuizDetails(quiz.quiz_id)">
                                        <i class="fas fa-eye me-1"></i>View Details
                                    </button>
                                    <button class="btn btn-success btn-sm" @click="startQuiz(quiz.quiz_id)">
                                        <i class="fas fa-play me-1"></i>Start Quiz
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary Section -->
            <div v-if="activeSection === 'summary'">
                <summary-page :user-stats="userStats"></summary-page>
            </div>
        </div>

        <!-- Profile Edit Modal -->
        <div class="modal fade" id="profileModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-edit me-2"></i>Edit Profile
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="updateProfile">
                            <div class="mb-3">
                                <label for="fullName" class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="fullName" 
                                       v-model="editProfile.full_name" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" 
                                       v-model="editProfile.email" readonly>
                                <small class="text-muted">Email cannot be changed</small>
                            </div>
                            <div class="mb-3">
                                <label for="qualification" class="form-label">Qualification</label>
                                <input type="text" class="form-control" id="qualification" 
                                       v-model="editProfile.qualification">
                            </div>
                            <div class="mb-3">
                                <label for="dob" class="form-label">Date of Birth</label>
                                <input type="date" class="form-control" id="dob" 
                                       v-model="editProfile.dob">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" @click="updateProfile" :disabled="updatingProfile">
                            <span v-if="updatingProfile" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="fas fa-save me-1"></i>
                            {{ updatingProfile ? 'Updating...' : 'Update Profile' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quiz Details Modal -->
        <div class="modal fade" id="quizDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-info-circle me-2"></i>Quiz Details
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="selectedQuizDetails">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6><i class="fas fa-book text-primary"></i> Subject:</h6>
                                    <p class="fw-bold">{{ selectedQuizDetails.subject_name }}</p>
                                    
                                    <h6><i class="fas fa-bookmark text-success"></i> Chapter:</h6>
                                    <p class="fw-bold">{{ selectedQuizDetails.chapter_name }}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6><i class="fas fa-clock text-warning"></i> Duration:</h6>
                                    <p class="fw-bold">{{ selectedQuizDetails.time_duration }}</p>
                                    
                                    <h6><i class="fas fa-question-circle text-info"></i> Questions:</h6>
                                    <p class="fw-bold">{{ selectedQuizDetails.question_count }}</p>
                                </div>
                            </div>
                            
                            <div class="alert alert-success">
                                <i class="fas fa-trophy me-2"></i>
                                <strong>Highest Score (All Users):</strong> {{ selectedQuizDetails.highest_score_overall }}/{{ selectedQuizDetails.question_count }}
                            </div>
                            
                            <div v-if="selectedQuizDetails.user_attempts.length > 0">
                                <h6><i class="fas fa-history me-2"></i>Your Attempt History:</h6>
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Score</th>
                                                <th>Percentage</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="attempt in selectedQuizDetails.user_attempts" :key="attempt.attempt_date">
                                                <td>{{ attempt.score }}/{{ attempt.total_questions }}</td>
                                                <td>
                                                    <span class="badge" :class="getScoreBadgeClass(attempt.percentage)">
                                                        {{ attempt.percentage }}%
                                                    </span>
                                                </td>
                                                <td>{{ attempt.attempt_date }}</td>
                                            </tr>
                                        </tbody> 
                                    </table>
                                </div>
                            </div>
                            <div v-else class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                You haven't attempted this quiz yet.
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-success" @click="startQuizFromModal()" v-if="selectedQuizDetails">
                            <i class="fas fa-play me-1"></i>Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    
    data() {
        return {
            activeSection: 'dashboard',
            userProfile: {},
            userStats: {},
            availableQuizzes: [],
            filteredQuizzes: [],
            searchQuery: '',
            selectedSubject: 'all',
            selectedQuizDetails: null,
            loading: true,
            editProfile: {},
            updatingProfile: false,
            debugMode: false,
            
            
            csvExporting: false,
            
            subjectColors: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
            ]
        }
    },
    components: {
        'summary-page': SummaryPage
    },
    computed: {
        uniqueSubjects() {
            return [...new Set(this.availableQuizzes.map(quiz => quiz.subject_name))];
        }
    },
    
    methods: {
        checkAuthToken() {
            const token = localStorage.getItem('auth_token');
            console.log('Current auth token:', token);
            
            if (!token) {
                console.error('No auth token found, redirecting to login');
                this.$router.push('/login');
                return false;
            }
            return token;
        },

        async fetchUserProfile() {
            const token = this.checkAuthToken();
            if (!token) return;
            
            try {
                console.log('Fetching user profile...');
                const response = await fetch('/api/user/profile', {
                    headers: { 
                        'Authentication-Token': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Profile response status:', response.status);
                
                if (response.status === 401) {
                    console.error('Authentication failed, redirecting to login');
                    this.logout();
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Profile data received:', data);
                this.userProfile = data.profile;
                this.editProfile = { ...data.profile };
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        },
        
        async fetchUserStats() {
            const token = this.checkAuthToken();
            if (!token) return;
            
            try {
                console.log('Fetching user stats...');
                const response = await fetch('/api/user/statistics', {
                    headers: { 
                        'Authentication-Token': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Stats response status:', response.status);
                
                if (response.status === 401) {
                    this.logout();
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Stats data received:', data);
                this.userStats = data.statistics;
            } catch (error) {
                console.error('Error fetching user stats:', error);
            }
        },

        async fetchAvailableQuizzes() {
            const token = this.checkAuthToken();
            if (!token) return;
            
            try {
                this.loading = true;
                console.log('Fetching available quizzes...');
                
                const response = await fetch('/api/user/available_quizzes', {
                    headers: { 
                        'Authentication-Token': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Quizzes response status:', response.status);
                console.log('Response headers:', [...response.headers.entries()]);
                
                if (response.status === 401) {
                    this.logout();
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Raw quiz data received:', data);
                console.log('Quizzes array:', data.quizzes);
                console.log('Number of quizzes:', data.quizzes ? data.quizzes.length : 'undefined');
                
                this.availableQuizzes = data.quizzes || [];
                this.filteredQuizzes = [...this.availableQuizzes];
                
                console.log('Available quizzes set:', this.availableQuizzes);
                console.log('Filtered quizzes set:', this.filteredQuizzes);
                
            } catch (error) {
                console.error('Error fetching quizzes:', error);
                this.availableQuizzes = [];
                this.filteredQuizzes = [];
            } finally {
                this.loading = false;
                console.log('Loading set to false');
            }
        },
        
       
        async exportCSV() {
            if (this.csvExporting) return;
            
            const token = this.checkAuthToken();
            if (!token) return;
            
            try {
                this.csvExporting = true;
                
                console.log('Starting CSV export...');
                const response = await fetch('/api/user/export-csv', {
                    method: 'POST',
                    headers: {
                        'Authentication-Token': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 401) {
                    this.logout();
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(`Export failed: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Export response:', data);
                
                if (data.status === 'success') {
                   
                    this.pollForCompletion(data.job_id);
                } else {
                    throw new Error(data.message || 'Failed to start export');
                }
                
            } catch (error) {
                console.error('CSV export error:', error);
                alert('Failed to export CSV. Please try again.');
                this.csvExporting = false;
            }
        },
        
        async pollForCompletion(jobId) {
            const token = this.checkAuthToken();
            if (!token) return;
            
            const checkStatus = async () => {
                try {
                    const response = await fetch(`/api/user/export-status/${jobId}`, {
                        headers: {
                            'Authentication-Token': token,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Status check failed: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('CSV status update:', data);
                    
                    if (data.status === 'completed') {
                      
                        if (data.result && data.result.filename) {
                            await this.downloadCSV(data.result.filename);
                        }
                        this.csvExporting = false;
                    } else if (data.status === 'failed') {
                        throw new Error(data.message || 'Export failed');
                    } else {
                       
                        setTimeout(checkStatus, 2000);
                    }
                    
                } catch (error) {
                    console.error('Error checking CSV status:', error);
                    alert('Export failed. Please try again.');
                    this.csvExporting = false;
                }
            };
            
            
            setTimeout(checkStatus, 2000);
        },
        
        async downloadCSV(filename) {
            const token = this.checkAuthToken();
            if (!token) return;
            
            try {
                const response = await fetch(`/api/user/download-csv/${filename}`, {
                    headers: {
                        'Authentication-Token': token
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Download failed: ${response.status}`);
                }
                
               
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `my_quiz_history_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                
                alert('Quiz history downloaded successfully!');
                
            } catch (error) {
                console.error('CSV download error:', error);
                alert('Failed to download CSV. Please try again.');
            }
        },
        
        async viewQuizDetails(quizId) {
            const token = this.checkAuthToken();
            if (!token) return;
            
            try {
                const response = await fetch(`/api/quiz/${quizId}/details`, {
                    headers: { 
                        'Authentication-Token': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                this.selectedQuizDetails = data.quiz;
                
                
                const modal = new bootstrap.Modal(document.getElementById('quizDetailsModal'));
                modal.show();
            } catch (error) {
                console.error('Error fetching quiz details:', error);
                alert('Failed to load quiz details. Please try again.');
            }
        },
        
        startQuiz(quizId) {
            
            localStorage.setItem('currentQuizId', quizId);
            this.$router.push('/QuizAttemptPage');
        },
        
        startQuizFromModal() {
            if (this.selectedQuizDetails) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('quizDetailsModal'));
                modal.hide();
                this.startQuiz(this.selectedQuizDetails.quiz_id);
            }
        },
        
        async searchQuizzes() {
            const token = this.checkAuthToken();
            if (!token) return;
            
            if (!this.searchQuery.trim()) {
                this.filteredQuizzes = [...this.availableQuizzes];
                return;
            }
            
            try {
                const response = await fetch(`/api/search_quizzes?query=${encodeURIComponent(this.searchQuery)}`, {
                    headers: { 
                        'Authentication-Token': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                this.filteredQuizzes = data.results || [];
            } catch (error) {
                console.error('Error searching quizzes:', error);
                alert('Search failed. Please try again.');
            }
        },
        
        filterBySubject(subject) {
            console.log('Filtering by subject:', subject);
            console.log('Available quizzes before filter:', this.availableQuizzes);
            
            this.selectedSubject = subject;
            if (subject === 'all') {
                this.filteredQuizzes = [...this.availableQuizzes];
            } else {
                this.filteredQuizzes = this.availableQuizzes.filter(quiz => quiz.subject_name === subject);
            }
            
            console.log('Filtered quizzes after filter:', this.filteredQuizzes);
        },
        
        clearFilters() {
            this.selectedSubject = 'all';
            this.searchQuery = '';
            this.filteredQuizzes = [...this.availableQuizzes];
        },
        
        openProfileModal() {
            
            this.editProfile = { ...this.userProfile };
            const modal = new bootstrap.Modal(document.getElementById('profileModal'));
            modal.show();
        },
        
        async updateProfile() {
            if (this.updatingProfile) return;
            
            const token = this.checkAuthToken();
            if (!token) return;
            
            try {
                this.updatingProfile = true;
                
                const response = await fetch(`/api/users/${this.userProfile.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': token
                    },
                    body: JSON.stringify({
                        full_name: this.editProfile.full_name,
                        qualification: this.editProfile.qualification,
                        dob: this.editProfile.dob
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update profile');
                }
                
                const data = await response.json();
                
                
                this.userProfile = { ...this.userProfile, ...this.editProfile };
                
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                modal.hide();
                
                
                alert('Profile updated successfully!');
                
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to update profile. Please try again.');
            } finally {
                this.updatingProfile = false;
            }
        },
        
        getSubjectColor(subjectName) {
            const index = this.uniqueSubjects.indexOf(subjectName);
            return this.subjectColors[index % this.subjectColors.length];
        },
        
        darkenColor(color) {
            
            const hex = color.replace('#', '');
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        },
        
        getScoreBadgeClass(percentage) {
            if (percentage >= 80) return 'bg-success';
            if (percentage >= 60) return 'bg-warning';
            return 'bg-danger';
        },
        
        getThisMonthAttempts() {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            const monthlyData = this.userStats.monthly_activity || [];
            const thisMonth = monthlyData.find(month => month.month === currentMonth);
            return thisMonth ? thisMonth.attempts : 0;
        },
        
        logout() {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('currentQuizId');
            this.$router.push('/login');
        },
    },
    
    async mounted() {
        console.log('Dashboard component mounted');
        
        
        if (!this.checkAuthToken()) {
            return; 
        }
        
        try {
            
            await Promise.all([
                this.fetchUserProfile(),
                this.fetchUserStats(),
                this.fetchAvailableQuizzes()
            ]);
            
            console.log('All dashboard data loaded successfully');
            console.log('Final state - Available quizzes:', this.availableQuizzes.length);
            console.log('Final state - Filtered quizzes:', this.filteredQuizzes.length);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
           
            if (error.message && error.message.includes('401')) {
                this.logout();
            }
        }
    },
    
    beforeUnmount() {
       
    }
};