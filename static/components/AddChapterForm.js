export default {
    props: ["subjectId"], 

    template: `
    <div class="modal d-block" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add Chapter to Subject</h5>
                    <button type="button" class="close" @click="$emit('close')">&times;</button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitForm">
                        <div class="form-group">
                            <label for="chapterName">Chapter Name</label>
                            <input type="text" id="chapterName" class="form-control" v-model="chapter.name" required>
                        </div>
                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea id="description" class="form-control" v-model="chapter.description"></textarea>
                        </div>
                        <div class="mt-3">
                            <button type="submit" class="btn btn-success">Add Chapter</button>
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
            chapter: {
                name: "",
                description: "",
            }
        };
    },

    methods: {
        async submitForm() {
            try {
                const response = await fetch("/api/chapters", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token")
                    },
                    body: JSON.stringify({
                        name: this.chapter.name,
                        description: this.chapter.description,
                        subject_id: this.subjectId  
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Chapter added successfully!");
                    this.$emit("chapter-added"); 
                } else {
                    alert("Failed to add chapter: " + (data.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error adding chapter:", error);
                alert("Error adding chapter. Check console for details.");
            }
        }
    }
};
