async function getUserCubes() {
  const url = link + "/get_user_cubes";
  console.log(url)
  const data = {
    token: token
  };

  try {
    const response = await fetch(url, {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user cubes');
    }

    const userCubes = await response.json();

    // Mapujemy odpowiedź JSON tylko do potrzebnych pól
    const cubesData = userCubes.map(cube => ({
      Mac: cube.Mac, Cube_users_ID: cube.Cube_users_ID
    }));

    return cubesData;

  } catch (error) {
    console.error('Error fetching user cubes:', error);
    throw error; // Ponowne rzucenie błędu dla obsługi przez wywołującego
  }
}

async function saveTaskToServer(taskName) {
  const url = link + "/add_project";
  const data = {
    token: token, name: taskName
  };

  try {
    const response = await fetch(url, {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to add project');
    }

    const responseData = await response.json();
    return {projectId: responseData.ProjectID}; // Assuming the response contains ProjectID
  } catch (error) {
    console.error('Error adding project:', error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
}

async function setProjectActive(projectId, cubeId, cubeMac, wall) {
  const url = link + "/set_project_active";
  const data = {
    token: token, project_id: projectId, cube_mac: cubeMac, cube_id: cubeId, side: wall
  };

  try {
    const response = await fetch(url, {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const jsonData = await response.json(); // Parse the response JSON

    console.log(jsonData)
    console.log(jsonData.success)
    console.log(jsonData.error)

    if (jsonData.success === false && jsonData.error === "Multiple projects on single cube's side") {
      console.log("Multiple projects on single cube's side");
      return false;
    } else {
      const projectId = jsonData.ProjectID; // Extract ProjectID from the parsed JSON
      console.log('Project added successfully, ProjectID:', projectId);
      return true; // Return the ProjectID
    }

  } catch (error) {
    console.error('Error adding project:', error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
}


async function removeProject(project_id) {
  const url = link + "/remove_project";
  const data = {
    token: token, project_id: project_id
  };

  try {
    const response = await fetch(url, {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to add project');
    }

    const responseData = await response.json();
    return {projectId: responseData.ProjectID}; // Assuming the response contains ProjectID
  } catch (error) {
    console.error('Error adding project:', error);
    throw error; // Re-throw the error so it can be handled by the caller
  }
}

async function isTokenValid(token) {
  const url = link + "/get_user_cubes";
  const data = {
    token: token
  };

  try {
    const response = await fetch(url, {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(data)
    });

    const responseData = await response.json();

    if (response.ok && responseData.success !== false) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

async function showHistory(project_id, project_name) {
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
    historyDiv.style.zIndex = '100'; // Ensure it's above other content
    document.body.appendChild(historyDiv);

    // Add a close button to the history container
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.zIndex = '1100';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0px';
    closeButton.style.right = '0px';
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
      const endDate = new Date(utcTime.toLocaleString('en-US', {timeZone: 'Europe/Warsaw'})); // Add 1 hour to end time

      return {
        id: event.EventID.toString(),
        name: project_name,
        start: localTime.toISOString(), // YYYY-MM-DDTHH:MM:SSZ
        end: endDate.toISOString(), // YYYY-MM-DDTHH:MM:SSZ
        progress: 100,
      };
    });

    // console.log(tasks)

    let arrayCombinedToOneObject = combineTimeObjects(tasks, project_id);
    console.log(arrayCombinedToOneObject)

    const gantt = new Gantt(historyDiv, arrayCombinedToOneObject, {
      view_mode: 'Hour  ',
      language: 'en',
      custom_popup_html: function (task) {
        console.log(task)
        // Custom popup to show date and time
        const start_date = new Date(task.start);
        console.log(task.start)
        const end_date = new Date(task.end);
        console.log(task.end)

        return `
          <div class="details-container">
            <h5>${task.name}</h5>
            <p>Start: ${start_date.toLocaleString()}</p>
            <p>End: ${end_date.toLocaleString()}</p>
          </div>
        `;
      },
    });
  } catch (error) {
    console.error('Error fetching history:', error);
  }
}

function combineTimeObjects(dataArray) {
  const combinedArray = [];

  for (let i = 0; i < dataArray.length; i += 2) {
    const combinedObject = {
      name: dataArray[i].name,
      start: dataArray[i].start,
    };
    if (i + 1 === dataArray.length) {
      combinedObject.end = new Date(Date.now())
    } else {
      combinedObject.end = dataArray[i + 1].end
    }
    combinedArray.push(combinedObject);
  }

  return combinedArray;
}
