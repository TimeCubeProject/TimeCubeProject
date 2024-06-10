// pobranie tokena z localStorage
const token = localStorage.getItem('token');

class Cube {
    constructor(macAddress, cubeId) {
        this.cube_mac = macAddress;
        this.cube_id = cubeId;
    }

    // funkcja która wyświetla informację o dodaniu lub usunięciu kostki.
    display(action) {
        const actionText = action === 'add' ? 'dodana' : 'usunięta';
        return `<div>Kostka o MAC Address: ${this.cube_mac}, Kostka ID: ${this.cube_id} została ${actionText}.`;
    }

    // Konwertuje dane kostki oraz tokena na format JSON.
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

    // Pobiera listę kostek użytkownika oraz wypełnia opcje wyboru w formularzu.
    async init() {
        this.cubes = await getUserCubes();
        console.log(this.cubes)
        this.populateSelectOptions();
    }

    // Wysyła żądanie POST do serwera w celu dodania kostki. Po pomyślnym dodaniu wywołuje metodę displayCube.
    async addCube(cube) {
        try {
            const url = link + '/add_cube';
            const response = await fetch(url, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify(cube.toJSON())
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

    // usuniecie kostki
    async removeCube(cube) {
        try {
            const url = link + '/remove_cube';
            const response = await fetch(url, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify(cube.toJSON())
            });

            if (!response.ok) {
                throw new Error('Failed to remove Cube');
            }
            const responseData = await response.json();
            console.log('Response from server:', responseData);
            this.displayCube(cube, 'remove');
        } catch (error) {
            console.error('Error removing Cube from server:', error.message);
        }
    }

    // Wyświetla informację o dodaniu lub usunięciu kostki.
    displayCube(cube, action) {
        const addedCubeDiv = document.getElementById('addedCube');
        addedCubeDiv.innerHTML = cube.display(action);
    }

    // Wypełnia pola wyboru adresu MAC i ID kostki, bazując na dostępnych kostkach użytkownika.
    // Dodaje nasłuchiwanie na zmianę wyboru adresu MAC, co powoduje aktualizację dostępnych ID kostek.
    populateSelectOptions() {
        //pobieramy mac i cube
        const macSelect = document.getElementById('macSelect');
        const cubeIdSelect = document.getElementById('cubeIdSelect');

        // zamiana macSelect i cubeIdSelect na  Select MAC Address i Select Cube ID
        macSelect.innerHTML = '<option value="">Select MAC Address</option>';
        cubeIdSelect.innerHTML = '<option value="">Select Cube ID</option>';

        // umieszczenie w option wszystkich adresów mac danego uzytkownika
        const uniqueMacAddresses = new Set(this.cubes.map(cube => cube.Mac));
        uniqueMacAddresses.forEach(mac => {
            const option = document.createElement('option');
            option.value = mac;
            option.textContent = mac;
            macSelect.appendChild(option);
        });

        // dodanie nasłuchiwania na zmiane mac
        macSelect.addEventListener('change', () => {
            const selectedMac = macSelect.value;
            // wywolanie funkcji ktora wyswietli w option cube id tylko te cube_id ktore sa przypisane do konkretnego maca
            this.updateCubeIdOptions(selectedMac);
        });

        if (this.cubes.length > 0) {
            const firstMac = this.cubes[0].Mac;
            this.updateCubeIdOptions(firstMac);
        }
    }

    // Aktualizuje dostępne ID kostek w polu wyboru, w zależności od wybranego adresu MAC.
    updateCubeIdOptions(selectedMac) {
        const cubeIdSelect = document.getElementById('cubeIdSelect');
        cubeIdSelect.innerHTML = '<option value="">Select Cube ID</option>';

        const filteredCubes = this.cubes.filter(cube => cube.Mac === selectedMac);

        filteredCubes.forEach(cube => {
            const option = document.createElement('option');
            option.value = cube.Cube_users_ID;
            option.textContent = cube.Cube_users_ID;
            cubeIdSelect.appendChild(option);
        });
    }

}

// Inicjalizacja po wczytaniu strony
document.addEventListener('DOMContentLoaded', function () {
    const cubeList = new CubeList();
    const messageDiv = document.getElementById('message');
    const cubeForm = document.getElementById('CubeForm');
    const btnAddCube = document.getElementById('Add-Cube');
    const btnRemoveCube = document.getElementById('Remove-Cube');

    // nasluchiwacz na dodanie kostki
    btnAddCube.addEventListener('click', async function (event) {
        event.preventDefault();

        const macAddress = document.getElementById('macAddress').value;
        const cubeId = document.getElementById('cubeId').value;

        if (!macAddress || !cubeId) {
            return;
        }

        const newCube = new Cube(macAddress, cubeId);
        await cubeList.addCube(newCube);
        cubeForm.reset();
    });

    // nasluchiwacz na usuniecie kostki
    btnRemoveCube.addEventListener('click', async function (event) {
        event.preventDefault();

        const macSelect = document.getElementById('macSelect').value;
        const cubeIdSelect = document.getElementById('cubeIdSelect').value;

        if (!macSelect || !cubeIdSelect) {
            return;
        }

        const newCube = new Cube(macSelect, cubeIdSelect);
        await cubeList.removeCube(newCube);
        cubeForm.reset();
    })
});


