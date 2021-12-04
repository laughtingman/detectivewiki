Vue.component('v-select', VueSelect.VueSelect);

var app = new Vue({
	el: "#app",
	data() {
		return {
			tab: "characters",
			objects: [],
			relations: [],
			currentObject: null,
			currentRelationId: null,
			currentRelationDescription: "",
			mode: "view",
			search: "",
			sidebarWidth: 230,
			scroll: false,
			resize: false,
			scale: 1,

			types: [{
					label: "Персонажи",
					value: "characters",
					icon: "person"
				},
				{
					label: "Локации",
					value: "locations",
					icon: "place"
				},
				{
					label: "Организации",
					value: "organizations",
					icon: "groups"
				},
				{
					label: "События",
					value: "events",
					icon: "schedule"
				},
				{
					label: "Предметы",
					value: "items",
					icon: "build"
				},
			]
		}
	},
	methods: {
		addObject(type) {
			let obj = {
				id: `f${(+new Date).toString(16)}`,
				type: type,
				title: "без имени",
				description: ""
			}
			this.objects.push(obj);
			this.currentObject = obj;

			this.changeMode("view");

			Vue.nextTick(function() {
				let name = document.getElementById("name");
				name.focus();
				name.select();
			});
		},
		remObject() {
			if (confirm("Точно удалить запись и все связи?")) {
				this.relations = this.relations.filter(z => z.id1 != this.currentObject.id && z.id2 != this.currentObject.id);
				this.objects = this.objects.filter(z => z.id != this.currentObject.id);
				this.currentObject = null;
			}
		},
		openTab(tab) {
			this.tab = tab;
			this.currentObject = null;
			this.search = "";

		},
		changeMode(mode) {
			this.mode = mode;

			Vue.nextTick(() => {
				this.tree = this.makeTree(this.currentObject.id);
			});

		},
		openObject(id) {
			let obj = this.objects.find(z => z.id == id);

			if (this.tab != obj.type)
				this.openTab(obj.type);

			this.currentObject = obj;
			this.currentRelationId = null;
			this.currentRelationDescription = "";

			Vue.nextTick(() => {
				this.tree = this.makeTree(id);
			});
		},
		addRelation() {

			if (this.currentRelationId == null) return;

			let relation1 = {
				id1: this.currentObject.id,
				id2: this.currentRelationId,
				type: this.getObject(this.currentRelationId).type,
				description: this.currentRelationDescription
			}
			this.relations.push(relation1);

			let relation2 = {
				id1: this.currentRelationId,
				id2: this.currentObject.id,
				type: this.currentObject.type,
				description: this.currentRelationDescription
			}
			this.relations.push(relation2);

			this.currentRelationId = null;
			this.currentRelationDescription = "";
		},
		getObject(id) {
			return this.objects.find(z => z.id == id);
		},
		remRelation(id1, id2) {
			if (confirm("Точно удалить связь?"))
				this.relations = this.relations.filter(z => !(z.id1 == id1 && z.id2 == id2 || z.id2 == id1 && z.id1 == id2));
		},
		editRelation(id1, id2) {
			let relation = this.relations.find(z => z.id1 == id1 && z.id2 == id2);
			let desc = prompt("Описание", relation.description);

			if (desc != null) {
				relation.description = desc;
				if (confirm("Обновить обратную связь?"))
					this.relations.find(z => z.id2 == id1 && z.id1 == id2).description = desc;
			}
		},
		filterRelations(id, type) {
			return this.relations.filter(z => z.id1 == id && z.type == type);
		},

		makeTree(id) {

			let queue = [],
				visited = [],
				result = "";

			let root = document.querySelector("#tree");
			root.innerHTML = "";

			queue.push({
				id: id,
				pid: root,
				title: ""
			});

			while (queue.length > 0) {
				let queueItem = queue.shift();
				let objId = queueItem.id;
				let obj = this.objects.find(z => z.id == objId);
				let li = document.createElement("li");
				let icon = this.types.find(z => z.value == obj.type).icon;

				if (visited.indexOf(objId) != -1) {

					li.innerHTML = `<div class="sub"><span class='material-icons'>${icon}</span>&nbsp;${obj.title}</div>`;
					queueItem.pid.appendChild(li);
					continue;
				}

				let cls = (id == objId) ? "disabled" : "";

				li.innerHTML = `
										<div class="main" data-title="${queueItem.title}"><label for="${objId}"></label><a class="${cls}" href="#" onclick='app.openObject("${objId}")'><span class='material-icons me-1'>${icon}</span>${obj.title}</a></div>
										<input type="checkbox" id="${objId}" checked>`;

				let ul = document.createElement("ul");
				li.appendChild(ul);
				queueItem.pid.appendChild(li);

				let relatinos = this.relations.filter(z => z.id1 == obj.id);

				visited.push(obj.id);

				let last = true;

				for (let rel of relatinos) {
					if (visited.indexOf(rel.id2) == -1) {
						queue.push({
							id: rel.id2,
							pid: ul,
							title: rel.description
						});
						last = false;
					}
				}
				if (last) {
					ul.remove();
					li.classList.add("last");
				}
			}
		},

		mUp(e) {
			this.scroll = false;
		},
		mDown(e) {
			this.scroll = true;
			this.scrollX = e.pageX - e.currentTarget.offsetLeft;
			this.scrollY = e.pageY - e.currentTarget.offsetTop;
			this.scrollLeft = e.currentTarget.scrollLeft;
			this.scrollTop = e.currentTarget.scrollTop;
		},
		mMove(e) {
			if (this.scroll == false) return;
			const x = e.pageX - e.currentTarget.offsetLeft,
				y = e.pageY - e.currentTarget.offsetTop;
			const walkX = (x - this.scrollX),
				walkY = (y - this.scrollY);
			e.currentTarget.scrollLeft = this.scrollLeft - walkX;
			e.currentTarget.scrollTop = this.scrollTop - walkY;
		},
		mLeave(e) {
			this.scroll = false;
		},
		mWheel(e) {
			var delta = e.deltaY || e.detail || e.wheelDelta;

			if (delta < 0) {
				if (this.scale < 3) {
					this.scale += 0.1;
				} else {
					this.scale = 3;
				}

			} else {
				if (this.scale > 0.3) {
					this.scale -= 0.1;
				} else {
					this.scale = 0.3;
				}
			}
		},
		expandAll() {
			let checks = document.querySelectorAll(".tree input");
			for (let check of checks) {
				check.checked = true;
			}
		},
		collapseAll() {
			let checks = document.querySelectorAll(".tree input");
			for (let check of checks) {
				check.checked = false;
			}
		},
		zoomOut() {
			this.scale = 1;
		},
		openFile() {
			let that = this;
			let div = document.createElement('div');
			div.innerHTML = '<input type="file" accept=".json">';
			let fileInput = div.firstChild;
			fileInput.addEventListener('change', function() {
				let file = fileInput.files[0];
				if (file.name.match(/\.(json)$/)) {
					let reader = new FileReader();
					reader.onload = function() {

						try {
							let data = JSON.parse(reader.result);
							that.objects = data.objects;
							that.relations = data.relations;
						} catch (e) {
							alert("Файл не читается!");
						}

						div.remove();
					}
					reader.readAsText(file);
				} else {
					alert("Неправильный nbg файла!");
				}
			});
			fileInput.click();
		},
		saveToFile() {
			let download = function(content, fileName, contentType) {
				let a = document.createElement("a");
				let file = new Blob([content], {
					type: contentType
				});
				a.href = URL.createObjectURL(file);
				a.download = fileName;
				a.click();
				a.remove();
			};
			let data = {
				objects: this.objects,
				relations: this.relations,
			};
			download(JSON.stringify(data), 'detective.json', 'text/plain');
		},
		clearAll() {
			if (confirm("Точно удалить всё?!")) {
				this.objects = [];
				this.relatinos = [];
				this.currentObject = null;
			}
		},
		resizeDown(e) {
			this.resize = true;
		},
		resizeUp(e) {
			this.resize = false;
		},
		resizeMove(e) {

			if (this.resize == true) {
				let el = document.querySelector(".sidebar");
				let w = e.clientX - el.getBoundingClientRect().left;
				if (w >= 180 && w <= 500) {
					this.sidebarWidth = w;
				}
			}
		},
	},
	computed: {
		filterObjects() {
			if (this.search != "") {
				return this.objects.filter(z => z.type == this.tab && z.title.search(new RegExp(this.search, "i")) > -1).sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
			} else {
				return this.objects.filter(z => z.type == this.tab).sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
			}

		},
		filterOptions() {
			let ids = [];
			ids.push(this.currentObject.id);

			for (let relation of this.relations) {
				if (relation.id1 == this.currentObject.id) {
					ids.push(relation.id2);
				}
			}
			return this.objects.filter(z => ids.indexOf(z.id) == -1).sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
		}
	},
	mounted() {
		if (localStorage["detective_objects"]) {
			this.objects = JSON.parse(localStorage.getItem("detective_objects"));
		}
		if (localStorage["detective_relations"]) {
			this.relations = JSON.parse(localStorage.getItem("detective_relations"));
		}
	},
	updated() {
		localStorage.setItem("detective_objects", JSON.stringify(this.objects));
		localStorage.setItem("detective_relations", JSON.stringify(this.relations));
	},
});