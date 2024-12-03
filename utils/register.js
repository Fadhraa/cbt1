const fs = require('fs');
const path = require('path')

const loadUserData = () => {
    const filePath = path.join(__dirname, '../data', 'admin', `admin.json`);

    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const users = JSON.parse(data);  // Mengambil data JSON

            // Mencari akun berdasarkan username
            const user = users.find(acc => acc.username === username);
            if (user) {
                return user;  // Kembalikan data user jika ditemukan
            } else {
                console.error('Username tidak ditemukan');
                return null;  // Jika username tidak ditemukan
            }
        } else {
            console.error(`${role}.json tidak ditemukan`);
            return null;  // Jika file tidak ditemukan
        }
    } catch (err) {
        console.error('Terjadi kesalahan saat membaca file:', err);
        return null;  // Jika terjadi error
    }
};
const Simpan_Akun = function(username, email, password, role) {
    // Tentukan path direktori dan file JSON berdasarkan role
    const dirPath = path.join(__dirname, '../data', role);
    const filePath = path.join(dirPath, `${role}.json`);
    
    // Pastikan folder dengan role sudah ada, jika belum buat folder tersebut
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Baca file JSON untuk memeriksa apakah email sudah terdaftar
    let accounts = [];

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        accounts = JSON.parse(data);  // Parse data JSON
    } catch (err) {
        // Jika file kosong atau tidak ada file, array accounts tetap kosong
        if (err.code !== 'ENOENT') {
            console.error('Gagal membaca file:', err.message);
            return { success: false, message: 'Gagal membaca file' };
        }
    }

    // Cek apakah email sudah terdaftar
    const emailExists = accounts.some(account => account.email === email);
    if (emailExists){
        // Jika email sudah terdaftar, kembalikan pesan error
        return { success: false, message: 'Email sudah terdaftar' };
    }
    console.log(emailExists)
    // Data yang akan disimpan dalam file JSON
    const newAccount = {
        username: username,
        email: email,
        password: password, 
        role:role, 
        isLoggedin: false// Sebaiknya menggunakan enkripsi untuk password
    };

    // Tambahkan akun baru ke dalam array
    accounts.push(newAccount);

    // Tulis kembali data ke file JSON
    try {
        fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf8');
        return { success: true, message: 'Akun berhasil disimpan!' };
    } catch (writeErr) {
        console.error('Gagal menyimpan akun:', writeErr.message);
        return { success: false, message: 'Gagal menyimpan akun' };
    }
};



// Fungsi untuk logout (mengubah status isLoggedin menjadi false)
const Logout_Auth = (req, res, next) => {
    const user = req.session.user;

    if (!user) {
        return res.status(400).send('No user logged in.');
    }

    const { username, role, tingkat } = user;

    // Pastikan `role` ada di session
    if (!role) {
        return res.status(400).send('Role tidak ditemukan dalam session.');
    }

    // Hanya periksa tingkat jika role adalah siswa
    if (role === 'siswa' && !tingkat) {
        return res.status(400).send('Kelas tidak ditemukan dalam session.');
    }

    let filePath;

    // Tentukan path file berdasarkan role
    if (role === 'guru' || role === 'admin') {
        filePath = path.join(__dirname, '../data', role, `${role}.json`);
    } else if (role === 'siswa') {
        const kelasList = ['10', '11', '12'];

        if (!kelasList.includes(tingkat)) {
            return res.status(400).send('Kelas tidak valid.');
        }

        filePath = path.join(__dirname, '../data', 'siswa', tingkat, `siswa${tingkat}.json`);
    }

    // Cek apakah file JSON ada
    if (!fs.existsSync(filePath)) {
        return res.status(400).send(`File untuk ${role} di path ${filePath} tidak ditemukan.`);
    }

    try {
        // Membaca data dari file JSON
        const data = fs.readFileSync(filePath, 'utf8');
        const accounts = JSON.parse(data);

        // Mencari akun berdasarkan username
        const account = accounts.find(acc => acc.username === username);

        if (account) {
            // Mengubah status isLoggedin menjadi false
            account.isLoggedin = false;

            // Menyimpan perubahan kembali ke file JSON
            fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf8');

            // Melanjutkan ke route handler selanjutnya
            return next();
        } else {
            return res.status(400).send('Akun tidak ditemukan.');
        }
    } catch (err) {
        console.error('Gagal membaca atau menyimpan data:', err);
        return res.status(500).send('Terjadi kesalahan dalam logout.');
    }
};
// Fungsi untuk login

const Login_Auth = function(username, password, role) {
    let result = { success: false, message: 'Role tidak ditemukan' }; // Default result
    
    // Tentukan file path berdasarkan role
    let filePath;

    if (role === 'guru' || role === 'admin') {
        // Untuk admin dan guru, file JSON berada di direktori masing-masing
        filePath = path.join(__dirname, '../data', role, `${role}.json`);
        
        if (fs.existsSync(filePath)) {
            // Membaca file JSON untuk role guru/admin
            const data = fs.readFileSync(filePath, 'utf8');
            const accounts = JSON.parse(data);

            // Mencari akun berdasarkan username
            const account = accounts.find(acc => acc.username === username);
            if (account) {
                // Cek password
                if (account.password === password) {
                    account.isLoggedin = true; // Set status login menjadi true

                    // Menyimpan kembali file JSON dengan status isLoggedin yang diperbarui
                    fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf8');

                    // Kembalikan hasil login berhasil
                    result = {
                        success: true,
                        message: 'Login berhasil',
                        username: account.username,
                        role: role,
                        isLoggedin: account.isLoggedin
                    };
                } else {
                    result.message = 'Password salah'; // Password tidak cocok
                }
            } else {
                result.message = 'Username tidak ditemukan'; // Username tidak ada
            }
        } else {
            result.message = `${role}.json tidak ditemukan`; // File JSON untuk role tidak ditemukan
        }

    } else if (role === 'siswa') {
        const kelasList = ['10', '11', '12'];
        let siswaData = null;

        // Cari akun siswa di semua kelas
        for (let kelas of kelasList) {
            let siswaFilePath = path.join(__dirname, '../data', 'siswa', kelas, `siswa${kelas}.json`);
            
            if (fs.existsSync(siswaFilePath)) {
                const data = fs.readFileSync(siswaFilePath, 'utf8');
                const accounts = JSON.parse(data);
                
                // Cari akun siswa berdasarkan username
                siswaData = accounts.find(acc => acc.username === username);
                if (siswaData) {
                    break; // Keluar dari loop jika siswa ditemukan
                }
            }
        }

        if (siswaData) {
            // Cek password
            if (siswaData.password === password) {
                siswaData.isLoggedin = true; // Set status login menjadi true

                // Menyimpan kembali file JSON dengan status isLoggedin yang diperbarui
                const siswaFilePath = path.join(__dirname, '../data', 'siswa', siswaData.tingkat, `siswa${siswaData.tingkat}.json`);
                const accounts = JSON.parse(fs.readFileSync(siswaFilePath, 'utf8'));
                const siswaIndex = accounts.findIndex(acc => acc.username === username);
                
                if (siswaIndex !== -1) {
                    accounts[siswaIndex] = siswaData; // Perbarui data siswa yang ada
                    fs.writeFileSync(siswaFilePath, JSON.stringify(accounts, null, 2), 'utf8');
                }

                result = {
                    success: true,
                    message: 'Login berhasil',
                    username: siswaData.username,
                    nama: siswaData.nama,
                    role: 'siswa',
                    isLoggedin: true,
                    tingkat: siswaData.tingkat // Menambahkan kelas siswa
                };
            } else {
                result.message = 'Password salah'; // Password salah
            }
        } else {
            result.message = 'Username tidak ditemukan'; // Username tidak ada
        }
    } else {
        result.message = 'Role tidak valid'; // Jika role tidak dikenali
    }

    return result; // Mengembalikan hasil login
};
const checkUserLoginStatus = async (username, email, role) => {
    // Tentukan path file JSON berdasarkan role
    const filePath = path.join(__dirname, '../data', role, `${role}.json`);

    // Cek apakah file JSON ada
    if (!fs.existsSync(filePath)) {
        return { success: false, message: `${role}.json tidak ditemukan` };
    }

    try {
        // Membaca data dari file JSON
        const data = fs.readFileSync(filePath, 'utf8');
        const accounts = JSON.parse(data);

        // Mencari akun berdasarkan username dan email
        const account = accounts.find(acc => acc.username === username && acc.email === email);

        // Jika akun ditemukan, cek status login
        if (account) {
            if (account.isLoggedin) {
                // Jika sudah login, kembalikan informasi pengguna
                return { success: true, user: account };
            } else {
                // Jika belum login, kembalikan pesan bahwa pengguna belum login
                return { success: false, message: 'User is not logged in' };
            }
        } else {
            // Jika akun tidak ditemukan
            return { success: false, message: 'User not found' };
        }
    } catch (err) {
        console.error('Gagal membaca atau menyimpan data:', err);
        return { success: false, message: 'Terjadi kesalahan dalam membaca data' };
    }
};

// Route untuk login
module.exports = { Simpan_Akun, Login_Auth, Logout_Auth, checkUserLoginStatus,loadUserData };
