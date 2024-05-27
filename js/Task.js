const link = window.link
const token = localStorage.getItem('token')
class Task {
  constructor(ProjectID, CubeID, Side, Name, Time, Mac) {
    this.ProjectID = ProjectID;
    this.CubeID = CubeID;
    this.Side = Side;
    this.Name = Name;
    this.Time = Time;
    this.Mac = Mac;
  }

  createTaskElement() {
    const taskDiv = document.createElement('div');
    taskDiv.classList.add('task');

    if (this.Side === -1) {
      taskDiv.classList.add('unassigned-task');
    }

    const nameElement = document.createElement('h3');
    nameElement.textContent = this.Name;
    taskDiv.appendChild(nameElement);

    const projectIDElement = document.createElement('p');
    projectIDElement.textContent = `ProjectID: ${this.ProjectID}`;
    taskDiv.appendChild(projectIDElement);

    const cubeIDElement = document.createElement('p');
    cubeIDElement.textContent = `CubeID: ${this.CubeID}`;
    taskDiv.appendChild(cubeIDElement);

    const sideElement = document.createElement('p');
    sideElement.textContent = `Wall: ${this.Side}`;
    taskDiv.appendChild(sideElement);

    const timeElement = document.createElement('p');
    timeElement.textContent = `Time: ${this.Time}`;
    taskDiv.appendChild(timeElement);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-task-btn');
    buttonContainer.appendChild(editBtn);

    const showHistoryBtn = document.createElement('button');
    showHistoryBtn.textContent = 'History';
    showHistoryBtn.classList.add('show-history-btn');
    buttonContainer.appendChild(showHistoryBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-task-btn');
    buttonContainer.appendChild(deleteBtn);

    taskDiv.appendChild(buttonContainer);

    editBtn.addEventListener('click', () => {
      this.showEditPanel(taskDiv);
    });

    showHistoryBtn.addEventListener('click', () => {
      this.showHistory(this.ProjectID);
    });

    deleteBtn.addEventListener('click', async () => {
      const {modalOverlay, confirmBtn, cancelBtn} = createConfirmationIfUserWantToDelteTask();
      confirmBtn.addEventListener('click', async () => {
        taskDiv.remove();
        await removeProject(this.ProjectID);
        document.body.removeChild(modalOverlay);
      });

      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
      });
    });

    return taskDiv;
  }

  async showHistory(project_id) {
    const url = link + "/get_events";
    const data = {token: token, project_id: project_id};

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const historyData = await response.json();
      console.log('History Data:', historyData);

      // Check if there is an existing history container, if so remove it
      let existingHistoryDiv = document.querySelector('.history');
      if (existingHistoryDiv) {
        existingHistoryDiv.remove();
      }

      // Create a new history container
      const historyDiv = document.createElement('div');
      historyDiv.classList.add('history');
      historyDiv.style.position = 'fixed';
      historyDiv.style.top = '10px';
      historyDiv.style.right = '10px';
      historyDiv.style.width = '80%';
      historyDiv.style.height = '400px';
      historyDiv.style.padding = '10px';
      historyDiv.style.background = '#f0f0f0';
      historyDiv.style.border = '1px solid #ccc';
      historyDiv.style.zIndex = '1000'; // Ensure it's above other content
      document.body.appendChild(historyDiv);

      // Add a close button to the history container
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '5px';
      closeButton.style.right = '5px';
      closeButton.style.padding = '5px 10px';
      closeButton.style.background = '#007bff'; // blue background
      closeButton.style.color = '#fff'; // white text
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '5px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', () => {
        historyDiv.remove();
      });
      historyDiv.appendChild(closeButton);

      // Prepare data for Gantt chart
      const tasks = historyData.map(event => {
        const utcTime = new Date(event.Time);
        const localTime = new Date(utcTime.toLocaleString('en-US', {timeZone: 'Europe/Warsaw'}));
        const endDate = new Date(localTime.getTime() + 3600000); // Add 1 hour to end time

        return {
          id: event.EventID,
          name: event.Name,
          start: localTime.toISOString().slice(0, 10), // YYYY-MM-DD
          end: endDate.toISOString().slice(0, 10), // YYYY-MM-DD
          progress: 100,
        };
      });

      const gantt = new Gantt(historyDiv, tasks, {
        view_mode: 'Day',
        language: 'en',
      });
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }


  async showEditPanel(taskDiv) {
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.classList.add('overlay');
      document.body.appendChild(overlay);
    }

    const editPanel = document.createElement('div');
    editPanel.classList.add('edit-panel');

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = this.Name;
    nameInput.placeholder = 'name of Task';
    editPanel.appendChild(nameInput);

    const cubeIdSelect = document.createElement('select');
    cubeIdSelect.id = 'cubeIdSelect';
    cubeIdSelect.placeholder = 'cube ID';

    const macSelect = document.createElement('select');
    macSelect.id = 'macSelect';
    macSelect.placeholder = 'MAC Address';

    const cubeIdToMacMap = {};

    async function populateCubeIdSelect() {
      try {
        const userCubes = await getUserCubes();
        console.log('User Cubes:', userCubes);

        const uniqueCubeIds = new Set();

        userCubes.forEach(cube => {
          uniqueCubeIds.add(cube.Cube_users_ID);
          cubeIdToMacMap[cube.Cube_users_ID] = cubeIdToMacMap[cube.Cube_users_ID] || [];
          cubeIdToMacMap[cube.Cube_users_ID].push(cube.Mac);
        });

        cubeIdSelect.innerHTML = '';

        uniqueCubeIds.forEach(cubeId => {
          const option = document.createElement('option');
          option.value = cubeId;
          option.textContent = cubeId;
          cubeIdSelect.appendChild(option);
        });
        populateMacSelect(cubeIdSelect.value);

      } catch (error) {
        console.error('Failed to fetch user cubes:', error);
      }
    }

    function populateMacSelect(cubeId) {
      macSelect.innerHTML = '';

      const macs = cubeIdToMacMap[cubeId] || [];

      macs.forEach(mac => {
        const option = document.createElement('option');
        option.value = mac;
        option.textContent = mac;
        macSelect.appendChild(option);
      });
    }

    await populateCubeIdSelect();

    editPanel.appendChild(cubeIdSelect);
    editPanel.appendChild(macSelect);

    cubeIdSelect.addEventListener('change', function () {
      const selectedCubeId = cubeIdSelect.value;
      populateMacSelect(selectedCubeId);
    });

    const sideInput = document.createElement('input');
    sideInput.type = 'text';
    sideInput.value = this.Side;
    sideInput.placeholder = 'wall of cube';
    editPanel.appendChild(sideInput);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.classList.add('save-btn');

    saveBtn.addEventListener('click', async () => {
      const newCubeID = cubeIdSelect.value;
      const newSide = sideInput.value;
      // this.Name = nameInput.value;
      this.CubeID = newCubeID;
      this.Side = newSide;
      this.Mac = macSelect.value;
      this.updateTask(taskDiv);

      await setProjectActive(this.ProjectID, this.CubeID, macSelect.value, this.Side);
      document.body.removeChild(editPanel);
      taskManager.generateInitialTasks();
      overlay.style.display = 'none';

    });
    editPanel.appendChild(saveBtn);

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
  }

  updateTask(taskDiv) {
    const nameElement = taskDiv.querySelector('h3');
    const cubeIDElement = taskDiv.querySelectorAll('p')[1];
    const sideElement = taskDiv.querySelectorAll('p')[2];
    nameElement.textContent = this.Name;
    cubeIDElement.textContent = `CubeID: ${this.CubeID}`;
    sideElement.textContent = `Side: ${this.Side}`;
  }

}

function createConfirmationIfUserWantToDelteTask() {
  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('modal-overlay');

  const modal = document.createElement('div');
  modal.classList.add('modal');

  const modalMessage = document.createElement('p');
  modalMessage.textContent = 'Are you sure you want to delete this project?';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Yes';
  confirmBtn.classList.add('confirm-btn');

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'No';
  cancelBtn.classList.add('cancel-btn');

  modal.appendChild(modalMessage);
  modal.appendChild(confirmBtn);
  modal.appendChild(cancelBtn);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);
  return {modalOverlay, confirmBtn, cancelBtn};
}



