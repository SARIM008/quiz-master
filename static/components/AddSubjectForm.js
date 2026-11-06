export default {
    template: `
    <div class="modal d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add Subject</h5>
                    <button type="button" class="close" @click="$emit('close')">&times;</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitForm">
                        <div class="form-group">
                            <label for="subjectName">Subject Name</label>
                            <input type="text" id="subjectName" class="form-control" v-model="subjectName" required>
                        </div>
                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea id="description" class="form-control" v-model="description"></textarea>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" id="flagged" class="form-check-input" v-model="isFlagged">
                            <label for="flagged" class="form-check-label">Flag this subject</label>
                        </div>
                        <div class="mt-3">
                            <button type="submit" class="btn btn-success">Add Subject</button>
                            <button type="button" class="btn btn-secondary ml-2" @click="$emit('close')">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `,

    data() {
        return {
            subjectName: "",
            description: "",
            isFlagged: false
        };
    },

    methods: {
        async submitForm() {
            try {
                const response = await fetch("/api/subjects", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token")
                    },
                    body: JSON.stringify({
                        name: this.subjectName,
                        description: this.description,
                        is_flagged: this.isFlagged
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Subject added successfully!");
                    this.$emit("subject-added"); 
                } else {
                    alert("Failed to add subject: " + (data.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error adding subject:", error);
                alert("Error adding subject. Check console for details.");
            }
        }
    }
};
