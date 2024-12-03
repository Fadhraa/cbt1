function updateKelas() {
    const tingkat = document.getElementById("tingkat").value;
    const kelasSelect = document.getElementById("kelas");

    // Clear previous options
    kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>';

    // Define kelas options
    let kelasOptions = [];
    if (tingkat === "10") {
      kelasOptions = [
        "Merdeka 1", "Merdeka 2", "Merdeka 3", "Merdeka 4", "Merdeka 5", "Merdeka 6", "Merdeka 7", "Merdeka 8", "Merdeka 9"
      ];
    } else if (tingkat === "11") {
      kelasOptions = [
        "Merdeka 1", "Merdeka 2", "Merdeka 3", "Merdeka 4", "Merdeka 5", "Merdeka 6", "Merdeka 7", "Merdeka 8", "Merdeka 9"
      ];
    } else if (tingkat === "12") {
      kelasOptions = [
        "Merdeka 1", "Merdeka 2", "Merdeka 3", "Merdeka 4", "Merdeka 5", "Merdeka 6", "Merdeka 7", "Merdeka 8", "Merdeka 9"
      ];
    }

    // Populate the kelas dropdown with appropriate options
    kelasOptions.forEach(function(kelas) {
      const option = document.createElement("option");
      option.value = kelas;
      option.text = kelas;
      kelasSelect.appendChild(option);
    });
  }