Vue.component("Editor", {
	template: '<textarea :id="id"></textarea>',
	props: ["id", "value"],
	data() {
		return {
			editor: Object,
			oldValue: ""
		};
	},
	watch: {
		value(val) {
			this.$emit("input", this.value);
			if (this.oldValue !== val) {
				this.editor.setValue(val);
				this.oldValue = val;
			}
		}
	},

	mounted() {
		const editor = CodeMirror.fromTextArea(document.getElementById(this.id), {
			theme: "elegant",
			lineNumbers: true,
			lineWrapping: true,
      mode: "text/markdown",
			indentWithTabs: true,
			highlightFormatting: true,
			foldGutter: true,
			gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
			extraKeys: {
				"Ctrl-B": function(cm) {

					if (cm.somethingSelected() == false) {
						let pos = cm.getCursor();
						let word = cm.findWordAt(pos);
						cm.setSelection(word.anchor, word.head);
					}

					let selection = cm.getSelection();
					cm.replaceSelection("**" + selection + "**");
				},
				"Ctrl-I": function(cm) {
					let selection = cm.getSelection();
					cm.replaceSelection("*" + selection + "*");
				},
			},
		});

		editor.setValue(this.value);

		editor.setSize("100%", "100%");

		editor.on("change", () => {
			this.value = this.oldValue = editor.getValue();
		});

		this.editor = editor;
	},
});