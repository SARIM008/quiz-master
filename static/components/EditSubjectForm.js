export default {
    props: ["subject"],
    emits: ["close", "subject-updated"],
    
    template: `
    <div class="modal d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Subject</h5>
                    <button type="button" class="close" @click="$emit('close')">&times;</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="updateSubject">
                        <div class="form-group">
                            <label for="editSubjectName">Subject Name</label>
                            <input type="text" id="editSubjectName" class="form-control" v-model="subjectData.name" required>
                        </div>
                        <div class="form-group">
                            <label for="editDescription">Description</label>
                            <textarea id="editDescription" class="form-control" v-model="subjectData.description"></textarea>
                        </div>
                        <div class="mt-3">
                            <button type="submit" class="btn btn-success">Update Subject</button>
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
            subjectData: { ...this.subject }
        };
    },

    methods: {
        async updateSubject() {
            try {
                const response = await fetch(`/api/subjects/${this.subjectData.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token")
                    },
                    body: JSON.stringify({
                        name: this.subjectData.name,
                        description: this.subjectData.description
                    })
                });

                if (!response.ok) throw new Error("Failed to update subject");

                alert("Subject updated successfully!");
                this.$emit("subject-updated");
            } catch (error) {
                console.error("Error updating subject:", error);
                alert("Error updating subject.");
            }
        }
    }
};
