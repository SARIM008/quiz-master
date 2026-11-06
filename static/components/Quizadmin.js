export default {
  name: 'AdminQuizPage',
  template: `
  <div class="container mt-4">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div class="container-fluid">
        <span class="navbar-brand">Welcome, Admin</span>
        <form class="d-flex ms-auto me-3" @submit.prevent="search">
          <input class="form-control me-2" type="search" v-model="searchQuery" placeholder="Search" aria-label="Search">
          <button class="btn btn-outline-light" type="submit">Search</button>
        </form>
        <div class="navbar-nav d-flex flex-row">
          <router-link class="nav-link text-white me-3" to="/admindashboard">Summary</router-link>
          <router-link class="nav-link text-white me-3" to="/quiz" active-class="active">Quiz</router-link>
          <router-link class="nav-link text-white me-3" to="/admindashboard">Home</router-link>
          <a class="nav-link text-white" href="#" @click.prevent="logout">Logout</a>
        </div>
      </div>
    </nav>

    <!-- Quiz Management Title -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Quiz Management</h2>
      <button class="btn btn-success" @click="openAddQuizModal">
        <i class="fas fa-plus"></i> Add New Quiz
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Quiz Cards -->
    <div v-else class="row">
      <div v-for="quiz in filteredQuizzes" :key="quiz.id" class="col-lg-6 col-xl-4 mb-4">
        <div class="card h-100 shadow" :class="quiz.is_flagged ? 'bg-warning bg-opacity-25' : ''">
          <!-- Quiz Header -->
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-1">Quiz {{ quiz.id }}</h5>
              <small class="text-muted">
                Duration: {{ quiz.time_duration || 'Not set' }} | Chapter: {{ quiz.chapter_name || 'Unknown' }}
              </small>
            </div>
            <div class="d-flex">
              <button 
                class="btn btn-sm me-1"
                :class="quiz.is_flagged ? 'btn-warning' : 'btn-outline-warning'"
                @click="toggleQuizFlag(quiz.id, quiz.is_flagged)"
                :title="quiz.is_flagged ? 'Unflag Quiz' : 'Flag Quiz'"
              >
                <span v-if="quiz.is_flagged">🚩</span>
                <span v-else>🏳️</span>
                {{ quiz.is_flagged ? ' Unflag' : ' Flag' }}
              </button>
              <button class="btn btn-sm btn-outline-primary me-1" @click="editQuiz(quiz)">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteQuiz(quiz.id)">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>

          <!-- Quiz Body -->
          <div class="card-body">
            <p class="card-text text-muted mb-3" v-if="quiz.remarks">
              <strong>Remarks:</strong> {{ quiz.remarks }}
            </p>
            
            <!-- Questions List -->
            <div class="mb-3">
              <h6 class="fw-bold">Questions ({{ quiz.questions ? quiz.questions.length : 0 }})</h6>
              <div v-if="!quiz.questions || quiz.questions.length === 0" class="text-muted fst-italic">
                No questions added yet
              </div>
              <div v-else class="questions-list" style="max-height: 300px; overflow-y: auto;">
                <div 
                  v-for="(question, index) in quiz.questions" 
                  :key="question.id"
                  class="question-item border rounded p-2 mb-2"
                  :class="question.is_flagged ? 'bg-warning bg-opacity-25' : 'bg-light'"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <span class="badge bg-secondary me-2">Q{{ index + 1 }}</span>
                      <span class="question-text" style="word-break: break-word;">
                        {{ question.question_statement }}
                      </span>
                      <div class="mt-1">
                        <small class="text-success">✓ Option {{ question.correct_option }}</small>
                        <span v-if="question.is_flagged" class="badge bg-warning ms-2">Flagged</span>
                      </div>
                    </div>
                    <div class="btn-group btn-group-sm flex-shrink-0 ms-2">
                      <button 
                        class="btn btn-sm"
                        :class="question.is_flagged ? 'btn-warning' : 'btn-outline-warning'"
                        @click="toggleQuestionFlag(question.id, question.is_flagged)"
                        :title="question.is_flagged ? 'Unflag Question' : 'Flag Question'"
                      >
                        <span v-if="question.is_flagged">🚩</span>
                        <span v-else>🏳️</span>
                      </button>
                      <button 
                        class="btn btn-outline-primary btn-sm"
                        @click="editQuestion(quiz.id, question)"
                        title="Edit Question"
                      >
                        <i class="fas fa-edit">Edit</i>
                      </button>
                      <button 
                        class="btn btn-outline-danger btn-sm"
                        @click="deleteQuestion(question.id)"
                        title="Delete Question"
                      >
                        <i class="fas fa-trash">Delete</i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Question Button -->
            <button 
              class="btn btn-outline-success btn-sm w-100"
              @click="openAddQuestionModal(quiz.id)"
            >
              <i class="fas fa-plus"></i> Add Question to this Quiz
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Quizzes Message -->
    <div v-if="!loading && filteredQuizzes.length === 0" class="text-center mt-5">
      <div class="alert alert-info">
        <h5>No Quizzes Found</h5>
        <p>{{ searchQuery ? 'No quizzes match your search criteria.' : 'Get started by creating your first quiz!' }}</p>
        <button v-if="!searchQuery" class="btn btn-success" @click="openAddQuizModal">
          <i class="fas fa-plus"></i> Add New Quiz
        </button>
        <button v-else class="btn btn-secondary" @click="clearSearch">
          <i class="fas fa-times"></i> Clear Search
        </button>
      </div>
    </div>

    <!-- Add Quiz Modal -->
    <div class="modal fade" id="addQuizModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Quiz</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="quizChapterId" class="form-label">Chapter <span class="text-danger">*</span></label>
              <select 
                v-model="newQuizData.chapter_id" 
                class="form-select" 
                id="quizChapterId"
                required
              >
                <option value="">Select a chapter</option>
                <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
                  {{ chapter.name }} ({{ chapter.subject_name }})
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label for="quizDuration" class="form-label">Time Duration</label>
              <input 
                v-model="newQuizData.time_duration" 
                type="text" 
                class="form-control" 
                id="quizDuration"
                placeholder="e.g., 01:30 (HH:MM format)"
              />
            </div>
            <div class="mb-3">
              <label for="quizRemarks" class="form-label">Remarks</label>
              <textarea 
                v-model="newQuizData.remarks" 
                class="form-control" 
                id="quizRemarks"
                rows="3"
                placeholder="Enter quiz remarks or instructions"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addQuiz">Save Quiz</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Quiz Modal -->
    <div class="modal fade" id="editQuizModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Quiz</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editQuizDuration" class="form-label">Time Duration</label>
              <input 
                v-model="editQuizData.time_duration" 
                type="text" 
                class="form-control" 
                id="editQuizDuration"
                placeholder="e.g., 01:30 (HH:MM format)"
              />
            </div>
            <div class="mb-3">
              <label for="editQuizRemarks" class="form-label">Remarks</label>
              <textarea 
                v-model="editQuizData.remarks" 
                class="form-control" 
                id="editQuizRemarks"
                rows="3"
                placeholder="Enter quiz remarks or instructions"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveQuiz">Save Changes</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Question Modal -->
    <div class="modal fade" id="addQuestionModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Question</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="questionStatement" class="form-label">Question Statement <span class="text-danger">*</span></label>
              <textarea 
                v-model="newQuestionData.question_statement" 
                class="form-control" 
                id="questionStatement"
                rows="3"
                placeholder="Enter your question here"
                required
              ></textarea>
            </div>
            <div class="mb-3">
              <label for="option1" class="form-label">Option 1 <span class="text-danger">*</span></label>
              <input 
                v-model="newQuestionData.option1" 
                type="text" 
                class="form-control" 
                id="option1"
                placeholder="Enter option 1"
                required
              />
            </div>
            <div class="mb-3">
              <label for="option2" class="form-label">Option 2 <span class="text-danger">*</span></label>
              <input 
                v-model="newQuestionData.option2" 
                type="text" 
                class="form-control" 
                id="option2"
                placeholder="Enter option 2"
                required
              />
            </div>
            <div class="mb-3">
              <label for="option3" class="form-label">Option 3 <span class="text-danger">*</span></label>
              <input 
                v-model="newQuestionData.option3" 
                type="text" 
                class="form-control" 
                id="option3"
                placeholder="Enter option 3"
                required
              />
            </div>
            <div class="mb-3">
              <label for="option4" class="form-label">Option 4 <span class="text-danger">*</span></label>
              <input 
                v-model="newQuestionData.option4" 
                type="text" 
                class="form-control" 
                id="option4"
                placeholder="Enter option 4"
                required
              />
            </div>
            <div class="mb-3">
              <label for="correctOption" class="form-label">Correct Option <span class="text-danger">*</span></label>
              <select 
                v-model="newQuestionData.correct_option" 
                class="form-select" 
                id="correctOption"
                required
              >
                <option value="">Select correct option</option>
                <option :value="1">Option 1</option>
                <option :value="2">Option 2</option>
                <option :value="3">Option 3</option>
                <option :value="4">Option 4</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addQuestion">Save Question</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Question Modal -->
    <div class="modal fade" id="editQuestionModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Question</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editQuestionStatement" class="form-label">Question Statement <span class="text-danger">*</span></label>
              <textarea 
                v-model="editQuestionData.question_statement" 
                class="form-control" 
                id="editQuestionStatement"
                rows="3"
                placeholder="Enter your question here"
                required
              ></textarea>
            </div>
            <div class="mb-3">
              <label for="editOption1" class="form-label">Option 1 <span class="text-danger">*</span></label>
              <input 
                v-model="editQuestionData.option1" 
                type="text" 
                class="form-control" 
                id="editOption1"
                placeholder="Enter option 1"
                required
              />
            </div>
            <div class="mb-3">
              <label for="editOption2" class="form-label">Option 2 <span class="text-danger">*</span></label>
              <input 
                v-model="editQuestionData.option2" 
                type="text" 
                class="form-control" 
                id="editOption2"
                placeholder="Enter option 2"
                required
              />
            </div>
            <div class="mb-3">
              <label for="editOption3" class="form-label">Option 3 <span class="text-danger">*</span></label>
              <input 
                v-model="editQuestionData.option3" 
                type="text" 
                class="form-control" 
                id="editOption3"
                placeholder="Enter option 3"
                required
              />
            </div>
            <div class="mb-3">
              <label for="editOption4" class="form-label">Option 4 <span class="text-danger">*</span></label>
              <input 
                v-model="editQuestionData.option4" 
                type="text" 
                class="form-control" 
                id="editOption4"
                placeholder="Enter option 4"
                required
              />
            </div>
            <div class="mb-3">
              <label for="editCorrectOption" class="form-label">Correct Option <span class="text-danger">*</span></label>
              <select 
                v-model="editQuestionData.correct_option" 
                class="form-select" 
                id="editCorrectOption"
                required
              >
                <option value="">Select correct option</option>
                <option :value="1">Option 1</option>
                <option :value="2">Option 2</option>
                <option :value="3">Option 3</option>
                <option :value="4">Option 4</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveQuestion">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      loading: true,
      searchQuery: '',
      quizzes: [],
      chapters: [], 
      newQuizData: {
        chapter_id: '',
        time_duration: '',
        remarks: ''
      },
      editQuizData: {
        id: null,
        chapter_id: null,
        time_duration: '',
        remarks: ''
      },
      newQuestionData: {
        quiz_id: null,
        question_statement: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option: ''
      },
      editQuestionData: {
        id: null,
        quiz_id: null,
        question_statement: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option: ''
      }
    };
  },

  computed: {
    filteredQuizzes() {
      if (!this.searchQuery.trim()) {
        return this.quizzes;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.quizzes.filter(quiz => {
        
        const quizMatch = 
          quiz.id.toString().includes(query) ||
          (quiz.chapter_name && quiz.chapter_name.toLowerCase().includes(query)) ||
          (quiz.remarks && quiz.remarks.toLowerCase().includes(query));
        
        
        const questionMatch = quiz.questions && quiz.questions.some(question =>
          question.question_statement.toLowerCase().includes(query) ||
          question.option1.toLowerCase().includes(query) ||
          question.option2.toLowerCase().includes(query) ||
          question.option3.toLowerCase().includes(query) ||
          question.option4.toLowerCase().includes(query)
        );
        
        return quizMatch || questionMatch;
      });
    }
  },

  mounted() {
    this.fetchQuizzes();
    this.fetchChapters(); 
  },

  methods: {
    
    checkAuth() {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('No authentication token found. Please login again.');
        this.$router.push('/login');
        return false;
      }
      return true;
    },

    
    fetchChapters() {
      if (!this.checkAuth()) return;
      
      const token = localStorage.getItem('auth_token');
      
      fetch('/api/chapters', {
        headers: {
          'Authentication-Token': token,
        },
      })
      .then(async res => {
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch chapters: ${text}`);
        }
        return res.json();
      })
      .then(chaptersData => {
        if (chaptersData) {
          this.chapters = chaptersData;
        }
      })
      .catch(err => {
        console.error("Fetch chapters failed:", err.message);
      });
    },

    
    fetchQuizzes() {
      if (!this.checkAuth()) return;
      
      this.loading = true;
      const token = localStorage.getItem('auth_token');
      
      
      fetch('/api/admin/quiz_data', {
        headers: {
          'Authentication-Token': token,
        },
      })
      .then(async res => {
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          this.$router.push('/login');
          return;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch quizzes: ${text}`);
        }
        return res.json();
      })
      .then(quizzesData => {
        if (quizzesData) {
          this.quizzes = quizzesData;
        }
      })
      .catch(err => {
        console.error("Fetch quizzes failed:", err.message);
        alert('Failed to load quizzes. Please try again.');
      })
      .finally(() => {
        this.loading = false;
      });
    },

    
    openAddQuizModal() {
      this.newQuizData = {
        chapter_id: '',
        time_duration: '',
        remarks: ''
      };
      new bootstrap.Modal(document.getElementById('addQuizModal')).show();
    },

    openAddQuestionModal(quizId) {
      this.newQuestionData = {
        quiz_id: quizId,
        question_statement: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option: ''
      };
      new bootstrap.Modal(document.getElementById('addQuestionModal')).show();
    },

    
    addQuiz() {
      if (!this.newQuizData.chapter_id) {
        alert('Please select a chapter');
        return;
      }

      const token = localStorage.getItem('auth_token');
      
      fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token,
        },
        body: JSON.stringify(this.newQuizData),
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to add quiz: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchQuizzes();
          bootstrap.Modal.getInstance(document.getElementById('addQuizModal')).hide();
          alert('Quiz added successfully!');
        }
      })
      .catch(err => {
        console.error("Add quiz failed:", err.message);
        alert('Failed to add quiz. Please try again.');
      });
    },

    editQuiz(quiz) {
      this.editQuizData = {
        id: quiz.id,
        chapter_id: quiz.chapter_id,
        time_duration: quiz.time_duration || '',
        remarks: quiz.remarks || ''
      };
      new bootstrap.Modal(document.getElementById('editQuizModal')).show();
    },

    saveQuiz() {
      const token = localStorage.getItem('auth_token');
      
      fetch(`/api/quizzes/${this.editQuizData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token,
        },
        body: JSON.stringify({
          chapter_id: this.editQuizData.chapter_id,
          time_duration: this.editQuizData.time_duration,
          remarks: this.editQuizData.remarks
        }),
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to update quiz: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchQuizzes();
          bootstrap.Modal.getInstance(document.getElementById('editQuizModal')).hide();
          alert('Quiz updated successfully!');
        }
      })
      .catch(err => {
        console.error("Update quiz failed:", err.message);
        alert('Failed to update quiz. Please try again.');
      });
    },

    deleteQuiz(quizId) {
      if (!confirm("Are you sure you want to delete this quiz? This will also delete all associated questions.")) return;
      
      const token = localStorage.getItem('auth_token');
      
      fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authentication-Token': token,
        },
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to delete quiz: ${text}`);
        }
        return res.json();
      })
      .then(() => {
        this.fetchQuizzes();
        alert('Quiz deleted successfully!');
      })
      .catch(err => {
        console.error("Delete quiz failed:", err.message);
        alert('Failed to delete quiz. Please try again.');
      });
    },

    toggleQuizFlag(quizId, currentFlagStatus) {
      const action = currentFlagStatus ? 'unflag' : 'flag';
      const confirmMessage = currentFlagStatus ? 
        'Are you sure you want to unflag this quiz?' : 
        'Are you sure you want to flag this quiz?';
      
      if (!confirm(confirmMessage)) return;

      const token = localStorage.getItem('auth_token');
      
      fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token,
        },
        body: JSON.stringify({ is_flagged: !currentFlagStatus }),
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to ${action} quiz: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchQuizzes();
          alert(`Quiz ${action}ged successfully!`);
        }
      })
      .catch(err => {
        console.error(`${action} quiz failed:`, err.message);
        alert(`Failed to ${action} quiz. Please try again.`);
      });
    },

    
    addQuestion() {
      if (!this.newQuestionData.question_statement.trim() || 
          !this.newQuestionData.option1.trim() || 
          !this.newQuestionData.option2.trim() ||
          !this.newQuestionData.option3.trim() || 
          !this.newQuestionData.option4.trim() ||
          !this.newQuestionData.correct_option) {
        alert('Please fill in all fields');
        return;
      }

      const token = localStorage.getItem('auth_token');
      
      fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token,
        },
        body: JSON.stringify(this.newQuestionData),
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to add question: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchQuizzes();
          bootstrap.Modal.getInstance(document.getElementById('addQuestionModal')).hide();
          alert('Question added successfully!');
        }
      })
      .catch(err => {
        console.error("Add question failed:", err.message);
        alert('Failed to add question. Please try again.');
      });
    },

    editQuestion(quizId, question) {
      this.editQuestionData = {
        id: question.id,
        quiz_id: quizId,
        question_statement: question.question_statement,
        option1: question.option1,
        option2: question.option2,
        option3: question.option3,
        option4: question.option4,
        correct_option: question.correct_option
      };
      new bootstrap.Modal(document.getElementById('editQuestionModal')).show();
    },

    saveQuestion() {
      if (!this.editQuestionData.question_statement.trim() || 
          !this.editQuestionData.option1.trim() || 
          !this.editQuestionData.option2.trim() ||
          !this.editQuestionData.option3.trim() || 
          !this.editQuestionData.option4.trim() ||
          !this.editQuestionData.correct_option) {
        alert('Please fill in all fields');
        return;
      }

      const token = localStorage.getItem('auth_token');
      
      fetch(`/api/questions/${this.editQuestionData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token,
        },
        body: JSON.stringify({
          quiz_id: this.editQuestionData.quiz_id,
          question_statement: this.editQuestionData.question_statement,
          option1: this.editQuestionData.option1,
          option2: this.editQuestionData.option2,
          option3: this.editQuestionData.option3,
          option4: this.editQuestionData.option4,
          correct_option: this.editQuestionData.correct_option
        }),
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to update question: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchQuizzes();
          bootstrap.Modal.getInstance(document.getElementById('editQuestionModal')).hide();
          alert('Question updated successfully!');
        }
      })
      .catch(err => {
        console.error("Update question failed:", err.message);
        alert('Failed to update question. Please try again.');
      });
    },

    deleteQuestion(questionId) {
      if (!confirm("Are you sure you want to delete this question?")) return;
      
      const token = localStorage.getItem('auth_token');
      
      fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authentication-Token': token,
        },
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to delete question: ${text}`);
        }
        return res.json();
      })
      .then(() => {
        this.fetchQuizzes();
        alert('Question deleted successfully!');
      })
      .catch(err => {
        console.error("Delete question failed:", err.message);
        alert('Failed to delete question. Please try again.');
      });
    },

    toggleQuestionFlag(questionId, currentFlagStatus) {
      const action = currentFlagStatus ? 'unflag' : 'flag';
      const confirmMessage = currentFlagStatus ? 
        'Are you sure you want to unflag this question?' : 
        'Are you sure you want to flag this question?';
      
      if (!confirm(confirmMessage)) return;

      const token = localStorage.getItem('auth_token');
      
      fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': token,
        },
        body: JSON.stringify({ is_flagged: !currentFlagStatus }),
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to ${action} question: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          this.fetchQuizzes();
          alert(`Question ${action}ged successfully!`);
        }
      })
      .catch(err => {
        console.error(`${action} question failed:`, err.message);
        alert(`Failed to ${action} question. Please try again.`);
      });
    },

    
    search() {
  
      if (!this.searchQuery.trim()) {
        return;
      }
      
      
      console.log(`Searching for: ${this.searchQuery}`);
    },

    clearSearch() {
      this.searchQuery = '';
    },

    logout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    }
  }
};