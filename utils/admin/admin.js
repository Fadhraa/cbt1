const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// Pastikan path file siswa.json benar
const filePath_Siswa = path.join(__dirname, '..', '..', 'data', 'siswa', 'siswa.json'); 
const filePath_Guru = path.join(__dirname, '..', '..', 'data', 'guru', 'guru.json'); 

// Fungsi untuk memuat data siswa
function load_Siswa(req) {
    // Pastikan user yang login adalah admin
    const user = req.session.user; 

    // Cek apakah user ada dan memiliki role admin
    if (user && user.role === 'admin') {
        // Tentukan path direktori utama data siswa
        const baseDirPath = path.join(__dirname, '../../data', 'siswa');
        let siswaData = [];

        // Baca data dari semua tingkat dan kelas
        if (fs.existsSync(baseDirPath)) {
            const tingkatDirs = fs.readdirSync(baseDirPath); // Membaca semua folder tingkat (misalnya 10, 11, 12)

            // Loop untuk membaca semua kelas dalam setiap tingkat
            tingkatDirs.forEach(tingkat => {
                const kelasFilePath = path.join(baseDirPath, tingkat);
                const kelasFiles = fs.readdirSync(kelasFilePath); // Membaca semua kelas dalam tingkat tersebut

                kelasFiles.forEach(kelas => {
                    const filePath = path.join(kelasFilePath, kelas);
                    if (fs.existsSync(filePath)) {
                        const fileData = fs.readFileSync(filePath, 'utf-8');
                        siswaData = siswaData.concat(JSON.parse(fileData)); // Gabungkan semua data siswa
                    }
                });
            });
        }

        return siswaData;
    }

    // Jika bukan admin atau tidak ada user, kembalikan array kosong
    return [];
}
function load_Guru(req) {
    // Pastikan user yang login adalah admin
    // Ambil data user dari session
    const user = req.session.user; 
    // Cek apakah user ada dan memiliki role admin
    if (user && user.role === 'admin') {
        if (fs.existsSync(filePath_Guru)) {
            // Jika file ada, baca dan parse JSON
            const guruData = JSON.parse(fs.readFileSync(filePath_Guru, 'utf-8'));
            return guruData;
        } else {
            // Jika file tidak ada, kembalikan array kosong
            return [];
        }
    }

    // Jika bukan admin atau tidak ada user, kembalikan array kosong
    return [];
}
const Simpan_siswa = function (nama, tingkat, kelas) {
    // Tentukan path direktori dan file berdasarkan tingkat dan kelas
    const dirPath = path.join(__dirname, '../../data', 'siswa', tingkat);
    const filePath = path.join(dirPath, `siswa${tingkat}.json`);

    // Pastikan folder ada
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Baca data siswa yang sudah ada dari file
    let siswaData = [];
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath);
        siswaData = JSON.parse(fileData);
    }

    // Menghitung urutan siswa berdasarkan jumlah siswa yang ada di kelas
    const urutanSiswa = siswaData.length + 1;
    const formattedUrutan = urutanSiswa.toString().padStart(3, '0'); // Menambahkan padding jika urutannya kurang dari 3 digit

    // Membuat username otomatis
    const username = `siswa${tingkat}-${formattedUrutan}`;

    // Membuat password otomatis, berdasarkan tingkat dan angka acak
    const randomPassword = `${tingkat}-${crypto.randomBytes(3).toString('hex')}`;

    // Membuat objek data siswa baru
    const newSiswa = {
        nama: nama,
        username: username,
        password: randomPassword, // Password yang dibuat otomatis
        tingkat: tingkat,
        kelas: kelas,
        isLoggedin: false,
    };

    // Menambahkan data siswa baru ke dalam array
    siswaData.push(newSiswa);

    // Menyimpan data siswa ke dalam file JSON
    try {
        fs.writeFileSync(filePath, JSON.stringify(siswaData, null, 2));
        return { success: true, message: 'Data siswa berhasil disimpan' };
    } catch (error) {
        console.error("Error menyimpan data siswa:", error);
        return { success: false, message: 'Gagal menyimpan data siswa' };
    }
}
module.exports = {
    load_Siswa,load_Guru, Simpan_siswa
}; 