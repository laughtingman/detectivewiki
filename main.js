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
			directRelationDescription: "",
			reverseRelationDescription: "",
			mergedId: null,
			changedType: null,
			mode: "view",
			search: "",
			scroll: false,
			resize: false,
			scale: 1,
			fullScreen: false,
			options: {
				eventDates: false,
				sidebarWidth: 230,
			},
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
				{
					label: "Понятия",
					value: "concepts",
					icon: "psychology"
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
				this.relations = this.relations.filter(z => z.id1 != this.currentObject.id && z.id2 != this.currentObject.id);
				this.objects = this.objects.filter(z => z.id != this.currentObject.id);
				this.currentObject = null;
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
		openObject(id, scrollMenu=true) {
			let obj = this.objects.find(z => z.id == id);

			if (this.tab != obj.type)
				this.openTab(obj.type);

			this.currentObject = obj;
			this.currentRelationId = null;
			this.currentRelationDescription = "";

			Vue.nextTick(() => {
				this.tree = this.makeTree(id);
				this.sctollToLi("l"+id);
				if (scrollMenu) this.scrollMenu();
				this.resizeTextarea();
			});
		},

		sctollToLi(id) {
			let el = document.getElementById(id);

			let parent = el.parentElement;
			while(true) {
				if (parent == null || parent.id == "tree") {
					break;
				}

				if (parent.nodeName == "LI") {
					let checkbox = parent.querySelector("input[type=checkbox]");
					if (checkbox) {
						checkbox.checked = true;
					}
				}
				parent = parent.parentElement;
			}

			scroller = document.querySelector(".treeview .scroll");
			offsets = getOffsets(el,"scroll");
			scroller.scroll(
				{
					left: (offsets.offsetLeft - scroller.clientWidth/2 + el.clientWidth/2) * this.scale,
					top: (offsets.offsetTop - scroller.clientHeight/2 + el.clientHeight/2) * this.scale,
					behavior: 'smooth'
				}
			);
			el.focus({preventScroll: true});
			document.querySelector(".content").scrollY = 0;

			function getOffsets(el, cls) {
				let parent = el, offsetTop = 0, offsetLeft = 0;
				while (true) {
					offsetTop += parent.offsetTop;
					offsetLeft += parent.offsetLeft;
					parent = parent.parentNode;
					if (parent.classList.contains(cls)) {
						break;
					}
				}
				return {offsetTop:offsetTop, offsetLeft:offsetLeft};
			}
		},

		scrollMenu() {
			let menu = document.querySelector(".sidebar .list");
			let selected = menu.querySelector(".active");
			if (selected) {
				menu.scrollTo({top:selected.offsetTop, behavior:"smooth"});
			}
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

		getIcon(type) {
			return this.types.find(z=>z.value == type).icon;
		},

		remRelation(id1, id2) {
				this.relations = this.relations.filter(z => !(z.id1 == id1 && z.id2 == id2 || z.id2 == id1 && z.id1 == id2));
		},
		editRelation(id1, id2) {
			this.directRelationDescription = this.relations.find(z => z.id1 == id1 && z.id2 == id2).description;
			this.reverseRelationDescription = this.relations.find(z => z.id2 == id1 && z.id1 == id2).description;
		},
		updateRelation(id1, id2) {
			this.relations.find(z => z.id1 == id1 && z.id2 == id2).description = this.directRelationDescription;
			this.relations.find(z => z.id2 == id1 && z.id1 == id2).description = this.reverseRelationDescription;
		},
		filterRelations(id, type) {
			return this.relations.filter(z => z.id1 == id && z.type == type);
		},

		makeTree(id) {

			let queue = [],
				visited = [];

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

				if (queueItem.title == "") {
					queueItem.title = this.printText(obj.description);
				}
			
				if (visited.indexOf(objId) != -1) {

					li.innerHTML = `<div class="sub">
						<a href="#" onclick="app.sctollToLi('l${objId}'); return false;"><span class='material-icons me-1'>${icon}</span><span class="name">${obj.title}</span></a>
						<div class="text-secondary mx-2">${this.printText(queueItem.title)}</div>
					</div>`;
					queueItem.pid.appendChild(li);
					continue;
				}

				let cls = (id == objId) ? "disabled" : "";

				li.innerHTML = `
										<div class="main" id="l${objId}" tabindex="0"><label for="${objId}"></label><a class="${cls}" href="#l${objId}" onclick='app.openObject("${objId}"); return false;'><span class='material-icons me-1'>${icon}</span><span class="name">${obj.title}</span></a>
										<div class="text-secondary mx-2">${this.printText(queueItem.title)}</div>
										</div>
										<input type="checkbox" class="form-check-input" id="${objId}" checked>`;

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
					alert("Неправильный форомат файла!");
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
				this.objects = [];
				this.relatinos = [];
				this.currentObject = null;
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
					this.options.sidebarWidth = w;
				}
			}
		},
		listKeyDown() {
			if (this.filterObjects.length==0) return;

			if(this.currentObject == null) {
				this.openObject(this.filterObjects[0].id);
			} else {
				let index = this.filterObjects.indexOf(this.currentObject);
				if (index < this.filterObjects.length) {
					this.openObject(this.filterObjects[index+1].id);
				}
			}

		},
		listKeyUp() {
			if (this.filterObjects.length==0) return;
			if (this.currentObject != null) {
				let index = this.filterObjects.indexOf(this.currentObject);
				console.log(index);
				if (index > 0) {
					this.openObject(this.filterObjects[index-1].id);
				}
			}
		},
		merge() {
			for (let relation of this.relations.filter(z=>z.id1==this.mergedId)) {
				if (relation.id2 != this.currentObject.id) {
					if (this.relations.find(z=>z.id1 == this.currentObject.id && z.id2 == relation.id2)==null) {
						relation.id1 = this.currentObject.id;
					}
				}
			}
			for (let relation of this.relations.filter(z=>z.id2==this.mergedId)) {
				if (relation.id1 != this.currentObject.id) {
					if (this.relations.find(z=>z.id2 == this.currentObject.id && z.id1 == relation.id1)==null) {
						relation.id2 = this.currentObject.id;
					}
				}
			}

			this.relations = this.relations.filter(z=>z.id1!= this.mergedId && z.id2 != this.mergedId);

			let merged = this.getObject(this.mergedId);
			this.currentObject.description += "\n" +  merged.description;

			this.objects = this.objects.filter(z=>z.id != this.mergedId);
			this.mergedId = null;
			this.modalOpen = false;
		},
		changeType() {
			this.tab = this.changedType;
			this.currentObject.type = this.changedType;
			this.changedType = null;
			this.modalOpen = false;
		},
		resizeTextarea() {
			let txt = this.$refs["textarea"];
			txt.style.height = "5em";
      txt.style.height = txt.scrollHeight + "px";
		},
		printText(text) {
			return text.replace(/(?:\r\n|\r|\n)/g, '<br>');
		}
	},
	computed: {
		filterObjects() {
			let eventDates = this.options.eventDates;
			if (this.search != "") {
				return this.objects.filter(z => z.type == this.tab && z.title.search(new RegExp(this.search, "i")) > -1).sort((a,b)=> sort(a,b));
			} else {
				return this.objects.filter(z => z.type == this.tab).sort((a,b) => sort(a,b));
			}

			function sort (a, b) {
				let af = a.title, bf= b.title;
				if (a.type=='events') {
					if (eventDates) {
						af = a.time;
						bf = b.time;
					} else {
						af = a.step;
						bf = b.step;
					}
				}
				return (af > bf) ? 1 : ((af < bf) ? -1 : 0);
			};

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
		},
		filterMergable() {
			return this.objects.filter(z => z.id != this.currentObject.id).sort((a, b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
		},
	},
	mounted() {
		if (localStorage["detective_objects"]) {
			this.objects = JSON.parse(localStorage.getItem("detective_objects"));
		}
		if (localStorage["detective_relations"]) {
			this.relations = JSON.parse(localStorage.getItem("detective_relations"));
		}
		if (localStorage["detective_options"]) {
			this.options = JSON.parse(localStorage.getItem("detective_options"));
		}

		document.addEventListener('keyup', (event) => {
			if (event.key === "Escape") {
					this.fullScreen = false;
			}
		});
	},
	updated() {
		localStorage.setItem("detective_objects", JSON.stringify(this.objects));
		localStorage.setItem("detective_relations", JSON.stringify(this.relations));
		localStorage.setItem("detective_options", JSON.stringify(this.options));
	},
});