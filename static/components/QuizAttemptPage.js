// QuizAttempt.js
export default {
    template: `
    <div class="min-vh-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <!-- Quiz Header -->
        <nav class="navbar navbar-dark bg-dark shadow-lg">
            <div class="container-fluid">
                <div class="navbar-brand">
                    <i class="fas fa-graduation-cap me-2"></i>Quiz Master
                </div>
                <div class="navbar-text text-light" v-if="quizData">
                    <strong>{{ quizData.subject_name }} - {{ quizData.chapter_name }}</strong>
                </div>
                <div class="navbar-text text-warning" v-if="timeRemaining !== null">
                    <i class="fas fa-clock me-1"></i>
                    Time: {{ formatTime(timeRemaining) }}
                </div>
            </div>
        </nav>

        <div class="container-fluid py-4">
            <!-- Loading State -->
            <div v-if="loading" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading quiz...</span>
                </div>
                <p class="mt-2">Loading quiz questions...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                {{ error }}
                <div class="mt-2">
                    <button class="btn btn-secondary" @click="goBack">
                        <i class="fas fa-arrow-left me-1"></i>Back to Dashboard
                    </button>
                </div>
            </div>

            <!-- Quiz Interface -->
            <div v-else-if="quizData && !quizSubmitted">
                <div class="row">
                    <!-- Quiz Progress -->
                    <div class="col-12 mb-4">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">
                                        Question {{ currentQuestionIndex + 1 }} of {{ quizData.questions.length }}
                                    </h5>
                                    <div class="progress" style="width: 200px;">
                                        <div class="progress-bar" role="progressbar" 
                                             :style="'width: ' + ((currentQuestionIndex + 1) / quizData.questions.length * 100) + '%'">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Question Card -->
                    <div class="col-lg-8 offset-lg-2" v-if="currentQuestion">
                        <div class="card shadow-lg">
                            <div class="card-header bg-primary text-white">
                                <h5 class="mb-0">
                                    <i class="fas fa-question-circle me-2"></i>
                                    Question {{ currentQuestionIndex + 1 }}
                                </h5>
                            </div>
                            <div class="card-body">
                                <h6 class="card-title mb-4">
                                    {{ currentQuestion?.question || 'Loading question...' }}
                                </h6>
                                
                                <div class="list-group">
                                    <label v-for="(option, index) in (currentQuestion?.options || [])" 
                                           :key="index"
                                           class="list-group-item list-group-item-action">
                                        <input type="radio" 
                                               :name="'question_' + (currentQuestion?.id || 0)" 
                                               :value="index + 1"
                                               v-model="userAnswers[currentQuestion?.id]"
                                               class="form-check-input me-3">
                                        <span>{{ String.fromCharCode(65 + index) }}. {{ option }}</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="card-footer">
                                <div class="d-flex justify-content-between">
                                    <button class="btn btn-outline-secondary" 
                                            @click="previousQuestion"
                                            :disabled="currentQuestionIndex === 0">
                                        <i class="fas fa-arrow-left me-1"></i>Previous
                                    </button>
                                    
                                    <div>
                                        <button v-if="currentQuestionIndex < quizData.questions.length - 1"
                                                class="btn btn-primary" 
                                                @click="nextQuestion">
                                            Next<i class="fas fa-arrow-right ms-1"></i>
                                        </button>
                                        
                                        <button v-else
                                                class="btn btn-success" 
                                                @click="confirmSubmit">
                                            <i class="fas fa-check me-1"></i>Submit Quiz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Question Navigator -->
                        <div class="card mt-4">
                            <div class="card-header">
                                <h6 class="mb-0">Question Navigator</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-flex flex-wrap gap-2">
                                    <button v-for="(question, index) in quizData.questions"
                                            :key="question.id"
                                            class="btn btn-sm"
                                            :class="getQuestionButtonClass(index)"
                                            @click="goToQuestion(index)">
                                        {{ index + 1 }}
                                    </button>
                                </div>
                                <div class="mt-3">
                                    <small class="text-muted">
                                        <span class="badge bg-success me-2">Answered</span>
                                        <span class="badge bg-primary me-2">Current</span>
                                        <span class="badge bg-outline-secondary">Not Answered</span>
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quiz Results -->
            <div v-else-if="quizSubmitted && results">
                <div class="row justify-content-center">
                    <div class="col-lg-6">
                        <div class="card shadow-lg">
                            <div class="card-header bg-success text-white text-center">
                                <h4 class="mb-0">
                                    <i class="fas fa-trophy me-2"></i>Quiz Completed!
                                </h4>
                            </div>
                            <div class="card-body text-center">
                                <div class="mb-4">
                                    <h1 class="display-4 text-success">{{ results.score }}</h1>
                                    <p class="lead">out of {{ quizData.questions.length }}</p>
                                    <div class="progress mb-3">
                                        <div class="progress-bar bg-success" 
                                             :style="'width: ' + (results.score / quizData.questions.length * 100) + '%'">
                                        </div>
                                    </div>
                                    <h5 class="text-primary">
                                        {{ Math.round(results.score / quizData.questions.length * 100) }}%
                                    </h5>
                                </div>
                                
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    {{ getScoreMessage() }}
                                </div>
                            </div>
                            <div class="card-footer text-center">
                                <button class="btn btn-primary me-2" @click="goBack">
                                    <i class="fas fa-home me-1"></i>Back to Dashboard
                                </button>
                                <button class="btn btn-outline-secondary" @click="retakeQuiz">
                                    <i class="fas fa-redo me-1"></i>Retake Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Submit Confirmation Modal -->
        <div class="modal fade" id="submitModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Submit Quiz</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to submit your quiz?</p>
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            You have answered {{ Object.keys(userAnswers).length }} out of {{ quizData ? quizData.questions.length : 0 }} questions.
                        </div>
                        <p class="text-muted">You cannot change your answers after submission.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Continue Quiz
                        </button>
                        <button type="button" class="btn btn-success" @click="submitQuiz">
                            <i class="fas fa-check me-1"></i>Submit Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    
    data() {
        return {
            quizData: null,
            loading: true,
            error: null,
            currentQuestionIndex: 0,
            userAnswers: {},
            timeRemaining: null,
            timer: null,
            quizSubmitted: false,
            results: null,
            submitting: false
        }
    },
    
    computed: {
        currentQuestion() {
            if (!this.quizData?.questions || this.quizData.questions.length === 0) {
                return null;
            }
            return this.quizData.questions[this.currentQuestionIndex];
        }
    },
    
    methods: {
        async loadQuiz() {
            try {
                const quizId = localStorage.getItem('currentQuizId');
                if (!quizId) {
                    this.error = 'No quiz selected. Please go back and select a quiz.';
                    return;
                }
                
                const response = await fetch(`/api/start_quiz/${quizId}`, {
                    headers: { 'Authentication-Token': localStorage.getItem('auth_token') }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to load quiz');
                }
                
                const data = await response.json();
                this.quizData = data;
                this.setupTimer();
                this.loading = false;
                
            } catch (error) {
                console.error('Error loading quiz:', error);
                this.error = 'Failed to load quiz. Please try again.';
                this.loading = false;
            }
        },
        
        setupTimer() {
            console.log('Quiz data time_duration:', this.quizData?.time_duration);
            
            if (this.quizData?.time_duration) {
                let durationInMinutes;
                
                if (this.quizData.time_duration.includes(':')) {
                    
                    const [hours, minutes] = this.quizData.time_duration.split(':').map(Number);
                    durationInMinutes = (hours * 60) + minutes;
                } else if (typeof this.quizData.time_duration === 'number') {
                    
                    durationInMinutes = this.quizData.time_duration;
                } else {
                    //  extract number from string
                    const durationMatch = this.quizData.time_duration.match(/(\d+)/);
                    durationInMinutes = durationMatch ? parseInt(durationMatch[1]) : 30;
                }
                
                this.timeRemaining = durationInMinutes * 60; 
                console.log('Duration in minutes:', durationInMinutes);
                console.log('Time remaining set to:', this.timeRemaining, 'seconds');
                
                this.startTimer();
            } else {
                console.warn('No time_duration found in quiz data');
                this.timeRemaining = 30 * 60; 
                this.startTimer();
            }
        },
        
        startTimer() {
           
            if (this.timer) {
                clearInterval(this.timer);
            }
            
            console.log('Starting timer with', this.timeRemaining, 'seconds');
            
            this.timer = setInterval(() => {
                this.timeRemaining--;
                
                
                if (this.timeRemaining % 60 === 0) {
                    console.log('Time remaining:', this.formatTime(this.timeRemaining));
                }
                
                if (this.timeRemaining <= 0) {
                    this.timeUp();
                }
            }, 1000);
        },
        
        timeUp() {
            clearInterval(this.timer);
            alert('Time is up! Submitting your quiz automatically.');
            this.submitQuiz();
        },
        
        formatTime(seconds) {
            if (seconds < 0) seconds = 0;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        nextQuestion() {
            if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
                this.currentQuestionIndex++;
            }
        },
        
        previousQuestion() {
            if (this.currentQuestionIndex > 0) {
                this.currentQuestionIndex--;
            }
        },
        
        goToQuestion(index) {
            this.currentQuestionIndex = index;
        },
        
        getQuestionButtonClass(index) {
            const question = this.quizData.questions[index];
            const isAnswered = this.userAnswers[question.id];
            const isCurrent = index === this.currentQuestionIndex;
            
            if (isCurrent) return 'btn-primary';
            if (isAnswered) return 'btn-success';
            return 'btn-outline-secondary';
        },
        
        confirmSubmit() {
            const modal = new bootstrap.Modal(document.getElementById('submitModal'));
            modal.show();
        },
        
        async submitQuiz() {
            if (this.submitting) return;
            
            try {
                this.submitting = true;
                clearInterval(this.timer);
                
                // Hide modal if open
                const modal = bootstrap.Modal.getInstance(document.getElementById('submitModal'));
                if (modal) modal.hide();
                
                const response = await fetch('/api/submit_quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth_token')
                    },
                    body: JSON.stringify({
                        quiz_id: this.quizData.quiz_id,
                        answers: this.userAnswers
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to submit quiz');
                }
                
                const data = await response.json();
                this.results = data;
                this.quizSubmitted = true;
                
            } catch (error) {
                console.error('Error submitting quiz:', error);
                alert('Failed to submit quiz. Please try again.');
            } finally {
                this.submitting = false;
            }
        },
        
        getScoreMessage() {
            const percentage = Math.round(this.results.score / this.quizData.questions.length * 100);
            if (percentage >= 90) return 'Excellent performance! Outstanding work!';
            if (percentage >= 80) return 'Great job! You did very well!';
            if (percentage >= 70) return 'Good work! You have a solid understanding!';
            if (percentage >= 60) return 'Fair performance. Consider reviewing the material.';
            return 'Keep practicing! Review the topics and try again.';
        },
        
        goBack() {
            localStorage.removeItem('currentQuizId');
            this.$router.push('/UserDashboard');
        },
        
        retakeQuiz() {
            
            this.currentQuestionIndex = 0;
            this.userAnswers = {};
            this.quizSubmitted = false;
            this.results = null;
            this.setupTimer();
        }
    },
    
    mounted() {
        this.loadQuiz();
    },
    
    beforeUnmount() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
};