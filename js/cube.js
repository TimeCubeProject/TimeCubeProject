const token = localStorage.getItem('token');

class Cube {
  constructor(macAddress, cubeId) {
    this.cube_mac = macAddress;
    this.cube_id = cubeId;
  }

  display(action) {
    const actionText = action === 'add' ? 'dodana' : 'usunięta';
    return `<div>Kostka o MAC Address: ${this.cube_mac}, Kostka ID: ${this.cube_id} została ${actionText}. Token: ${token}</div>`;
  }

  toJSON() {
    return {
      cube_mac: this.cube_mac, cube_id: this.cube_id, token: token
    };
  }
}

class CubeList {
  constructor() {
    this.cubes = [];
    this.init();
  }

  async init() {
    this.cubes = await getUserCubes();
    console.log(this.cubes)
    this.populateSelectOptions();
  }


  async addCube(cube) {
    try {
      const url = link + '/add_cube';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cube.toJSON())
      });

      if (!response.ok) {
        throw new Error('Failed to add Cube');
      }
      const responseData = await response.json();
      console.log('Response from server:', responseData);
      this.displayCube(cube, 'add');
    } catch (error) {
      console.error('Error adding Cube to server:', error.message);
    }
  }

  async removeCube(cube) {
    try {
      const url = link + '/remove_cube';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cube.toJSON())
      });

      if (!response.ok) {
        throw new Error('Failed to remove Cube');
      }
      const responseData = await response.json();
      console.log('Response from server:', responseData);
      this.displayCube(cube, 'remove');
      showMessage('Kostka usunięta pomyślnie', 'success');
    } catch (error) {
      console.error('Error removing Cube from server:', error.message);
      showMessage('Błąd podczas usuwania kostki', 'error');
    }
  }

  displayCube(cube, action) {
    const addedCubeDiv = document.getElementById('addedCube');
    addedCubeDiv.innerHTML = cube.display(action);
  }

  populateSelectOptions() {
    const macSelect = document.getElementById('macSelect');
    const cubeIdSelect = document.getElementById('cubeIdSelect');

    // Clear existing options
    macSelect.innerHTML = '<option value="">Select MAC Address</option>';
    cubeIdSelect.innerHTML = '<option value="">Select Cube ID</option>';

    // Populate macSelect with unique MAC addresses
    const uniqueMacAddresses = new Set(this.cubes.map(cube => cube.Mac));
    uniqueMacAddresses.forEach(mac => {
      const option = document.createElement('option');
      option.value = mac;
      option.textContent = mac;
      macSelect.appendChild(option);
    });

    // Add event listener to macSelect to update cubeIdSelect
    macSelect.addEventListener('change', () => {
      const selectedMac = macSelect.value;
      this.updateCubeIdOptions(selectedMac);
    });

    // Initially populate cubeIdSelect based on the first MAC address
    if (this.cubes.length > 0) {
      const firstMac = this.cubes[0].Mac;
      this.updateCubeIdOptions(firstMac);
    }
  }

  updateCubeIdOptions(selectedMac) {
    const cubeIdSelect = document.getElementById('cubeIdSelect');
    cubeIdSelect.innerHTML = '<option value="">Select Cube ID</option>';

    // Filter cubes by selected MAC address
    const filteredCubes = this.cubes.filter(cube => cube.Mac === selectedMac);

    // Populate cubeIdSelect with Cube_users_IDs related to selected MAC
    filteredCubes.forEach(cube => {
      const option = document.createElement('option');
      option.value = cube.Cube_users_ID;
      option.textContent = cube.Cube_users_ID;
      cubeIdSelect.appendChild(option);
    });
  }

}

const cubeList = new CubeList();

document.addEventListener('DOMContentLoaded', function () {
  const messageDiv = document.getElementById('message');
  const cubeForm = document.getElementById('CubeForm');
  const btnAddCube = document.getElementById('Add-Cube');
  const btnRemoveCube = document.getElementById('Remove-Cube');

  btnAddCube.addEventListener('click', async function (event) {
    event.preventDefault();

    const macAddress = document.getElementById('macAddress').value;
    const cubeId = document.getElementById('cubeId').value;

    if (!macAddress || !cubeId) {
      showMessage('Please fill in all fields and make sure you are logged in', 'error');
      return;
    }

    const newCube = new Cube(macAddress, cubeId);
    await cubeList.addCube(newCube);
    cubeForm.reset();
  });

  btnRemoveCube.addEventListener('click', async function (event) {
    event.preventDefault();

    const macSelect = document.getElementById('macSelect').value;
    const cubeIdSelect = document.getElementById('cubeIdSelect').value;

    if (!macSelect || !cubeIdSelect) {
      showMessage('Please select both MAC Address and Cube ID', 'error');
      return;
    }

    const newCube = new Cube(macSelect, cubeIdSelect);
    await cubeList.removeCube(newCube);
    cubeForm.reset();
  })
});


