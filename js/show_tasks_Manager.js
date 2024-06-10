
class TaskManager {

  // Inicjalizacja elementów DOM: Pobiera elementy DOM takie jak kontenery na zadania, przyciski do dodawania i ładowania zadań.
  // Inicjalizacja właściwości: Ustawia początkowe właściwości takie jak lista zadań i stany przycisków "Load More".
  constructor() {
    this.tasksContainer = document.getElementById('tasks-container');
    this.unassignedTasksContainer = document.getElementById('unassigned-tasks-container');
    this.addTaskBtn = document.getElementById('add-task-btn');
    this.loadMoreAssignedBtn = document.getElementById('load-more-assigned-btn');
    this.loadMoreUnassignedBtn = document.getElementById('load-more-unassigned-btn');
    this.tasks = [];
    this.loadMoreAssignedClicked = false;
    this.loadMoreUnassignedClicked = false;
  }

  // metoda w klasie TaskManager która dodaje kostke jesli nie jest podany side to wtedy side jest równy -1
  addTask(ProjectID, name, cubeID = "", side = -1, time = 0) {
    const task = new Task(ProjectID, cubeID, side, name, time);
    this.tasks.push(task);
  }

  // metoda ktora renderuje zadania na stronie głównej, dzieląc je na przypisane i nieprzypisane.
  renderTasks() {
    this.tasksContainer.innerHTML = '';
    this.unassignedTasksContainer.innerHTML = '';

    // podzielenie taskow na przypisane i nie przypisane
    const assignedTasks = this.tasks.filter(task => task.Side !== -1);
    const unassignedTasks = this.tasks.filter(task => task.Side === -1);

    // pokazanie poczatkowo tylko 6 taskow (dotyczy taskow assigned i unassigned)
    const assignedTasksToShow = this.loadMoreAssignedClicked ? assignedTasks : assignedTasks.slice(0, 6);
    const unassignedTasksToShow = this.loadMoreUnassignedClicked ? unassignedTasks : unassignedTasks.slice(0, 6);

    assignedTasksToShow.forEach(task => {
      const taskElement = task.createTaskElement();
      this.tasksContainer.appendChild(taskElement);
    });

    unassignedTasksToShow.forEach(task => {
      const taskElement = task.createTaskElement();
      this.unassignedTasksContainer.appendChild(taskElement);
    });
  }

  // metoda która pobiera zadania z serwera, dodaje je do tablicy tasks  i sortuje je.
  async getTheProjects() {
    const token = localStorage.getItem('token');
    try {
      const url = link + '/get_user_projects';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({token})
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 101) { // Token invalid code
          throw new Error('Token expired or invalid');
        } else {
          throw new Error('Failed to fetch projects');
        }
      }

      const data = await response.json();
      this.tasks = [];
      data.forEach(project => {
        const ProjectID = project.ProjectID;
        const cubeID = project.Cube_users_ID;
        const side = project.Side;
        const name = project.Name;
        const time = project.Time || 0;
        this.addTask(ProjectID, name, cubeID, side, time);
      });

      // sortowanie taskow po sciankach w kolejnosi rosnacej
      this.tasks.sort((a, b) => a.Side - b.Side);
      this.renderTasks();
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  // Obsługuje logikę przycisków "Load More", które przełączają między wyświetlaniem wszystkich zadań a ograniczoną liczbą zadań.
  handleLoadMore() {
    let btnAssigned = document.getElementById("load-more-assigned-btn");
    let btnUnAssigned = document.getElementById("load-more-unassigned-btn");
    this.loadMoreAssignedBtn.addEventListener('click', () => {
      this.loadMoreAssignedClicked = !this.loadMoreAssignedClicked;
      this.loadMoreAssignedClicked === false ? btnAssigned.textContent = 'Show More' : btnAssigned.textContent = 'Show Less'
      this.renderTasks();
    });

    this.loadMoreUnassignedBtn.addEventListener('click', () => {
      this.loadMoreUnassignedClicked = !this.loadMoreUnassignedClicked;
      this.loadMoreUnassignedClicked === false ? btnUnAssigned.textContent = 'Show More' : btnUnAssigned.textContent = 'Show Less'
      this.renderTasks();
    });
  }

  // Obsługuje logikę dodawania nowego zadania przez użytkownika.
  handleAddTask() {
    this.addTaskBtn.addEventListener('click', () => {
      let overlay = document.querySelector('.overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);
      }
      // stworznie tymczasowego edit panela
      const editPanel = document.createElement('div');
      editPanel.classList.add('edit-panel');

      // stworznie tymczasowego Inputa do napisania nazwy taska
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.placeholder = 'Name of Task';
      editPanel.appendChild(nameInput);

      // utworzenie saveBtn
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.classList.add('save-btn');

      saveBtn.addEventListener('click', async () => {
        const name = nameInput.value;
        let projectId = "";
        if (name === '') {
          alert("name of task is empty")
        } else {
          try {
            const response = await saveTaskToServer(name);
            projectId = response.projectId;

            // Log the new project ID
            console.log('New project ID:', projectId);
          } catch (error) {
            console.error('Failed to save task to server:', error);
          }
        }
        this.addTask(projectId, name);

        this.renderTasks();

        // usuniecie editPanelu
        document.body.removeChild(editPanel);

        overlay.style.display = 'none';
      });

      editPanel.appendChild(saveBtn);

      // utworznie przycisku do zamkniecia panelu
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Cancel';
      closeBtn.classList.add('close-btn');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(editPanel);
        overlay.style.display = 'none';
      });
      editPanel.appendChild(closeBtn);

      overlay.style.display = 'block';
      document.body.appendChild(editPanel);
    });
  }
}

// Inicjalizuje stronę, tworząc instancję TaskManager i uruchamiając główne metody.
function initTheWebsite() {
  const taskManager = new TaskManager();

  taskManager.getTheProjects();
  taskManager.handleAddTask();
  taskManager.handleLoadMore();
}

document.addEventListener('DOMContentLoaded', initTheWebsite);

// funkcja ktora odswieza strone co 30 sekund
setInterval(initTheWebsite, 30000);
