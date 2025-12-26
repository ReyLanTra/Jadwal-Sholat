const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const body = document.getElementById('jadwalBody');

// ==========================
// Konfigurasi Aplikasi
// ==========================
const CONFIG = {
  audioEnabled: true,
  notificationsEnabled: true,
  autoRefresh: true,
  refreshInterval: 30000, // 30 detik
  checkPrayerInterval: 1000, // 1 detik
  audioPath: 'assets/audio/',
  adzanFiles: {
    subuh: 'adzan-subuh.mp3',
    default: 'adzan-umum.mp3'
  }
};

// State aplikasi
const APP_STATE = {
  currentAudio: null,
  lastPrayerPlayed: null,
  isTodayHighlighted: false,
  prayerTimes: [],
  notificationPermission: 'default',
  serviceWorkerRegistered: false
};

// ==========================
// Partikel Enhanced
// ==========================
function initParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;

  // Hapus partikel lama
  particlesContainer.innerHTML = '';

  const particleCount = 50;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = Math.random() * 8 + 2;
    const posX = Math.random() * 100;
    const duration = Math.random() * 25 + 15;
    const delay = Math.random() * 10;
    const color = Math.random() > 0.7 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(212, 175, 55, 0.3)';

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}vw`;
    particle.style.bottom = '0px';
    particle.style.opacity = Math.random() * 0.6 + 0.2;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.background = color;
    particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;

    particlesContainer.appendChild(particle);
  }
}

// ==========================
// Jam Real-time Enhanced
// ==========================
function updateClocks() {
  const now = new Date();

  const clockWIB = document.getElementById('clockWIB');
  const clockWITA = document.getElementById('clockWITA');
  const clockWIT = document.getElementById('clockWIT');

  if (!clockWIB || !clockWITA || !clockWIT) return;

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Format tanggal Indonesia
  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // WIB UTC+7
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  clockWIB.innerHTML = `
    <div style="font-size: 1.2em; font-weight: 800; color: var(--gold);">WIB</div>
    <div style="font-size: 1.4em; font-family: 'Courier New', monospace; margin: 5px 0;">
      ${formatTime(wibTime)}
    </div>
    <div style="font-size: 0.8em; opacity: 0.9;">Indonesia Barat</div>
  `;

  const witaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  clockWITA.innerHTML = `
    <div style="font-size: 1.2em; font-weight: 800; color: var(--gold);">WITA</div>
    <div style="font-size: 1.4em; font-family: 'Courier New', monospace; margin: 5px 0;">
      ${formatTime(witaTime)}
    </div>
    <div style="font-size: 0.8em; opacity: 0.9;">Indonesia Tengah</div>
  `;

  // WIT UTC+9
  const witTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  clockWIT.innerHTML = `
    <div style="font-size: 1.2em; font-weight: 800; color: var(--gold);">WIT</div>
    <div style="font-size: 1.4em; font-family: 'Courier New', monospace; margin: 5px 0;">
      ${formatTime(witTime)}
    </div>
    <div style="font-size: 0.8em; opacity: 0.9;">Indonesia Timur</div>
  `;

  // Update info tanggal
  updateDateInfo(now);
}

// ==========================
// Info Tanggal Enhanced
// ==========================
function updateDateInfo(date) {
  let dateInfo = document.getElementById('dateInfo');
  
  if (!dateInfo) {
    dateInfo = document.createElement('div');
    dateInfo.id = 'dateInfo';
    dateInfo.className = 'notification-panel';
    dateInfo.style.cssText += 'margin-top: 15px;';
    
    const controls = document.querySelector('.controls');
    if (controls) {
      controls.appendChild(dateInfo);
    }
  }
  
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const hijriDate = getHijriDate(date);
  
  dateInfo.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <div>
        <strong style="color: var(--gold);">📅 ${date.toLocaleDateString('id-ID', options)}</strong>
        <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
          <span style="background: rgba(212, 175, 55, 0.2); padding: 3px 8px; border-radius: 5px;">
            Hijriyah: ${hijriDate}
          </span>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="toggleAudio()" class="audio-btn" style="padding: 8px 15px; font-size: 0.8rem;">
          ${CONFIG.audioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
        </button>
        <button onclick="toggleNotifications()" class="audio-btn" style="padding: 8px 15px; font-size: 0.8rem;">
          ${CONFIG.notificationsEnabled ? '🔔 Notif ON' : '🔕 Notif OFF'}
        </button>
      </div>
    </div>
  `;
}

// ==========================
// Kalender Hijriyah
// ==========================
function getHijriDate(gregorianDate) {
  // Konversi sederhana Gregorian ke Hijriyah
  const hijriAdjust = -1; // Adjust sesuai kebutuhan
  const hijriMonthNames = [
    'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];
  
  // Perhitungan sederhana (bisa diganti dengan library yang lebih akurat)
  const daysSinceEpoch = Math.floor((gregorianDate - new Date(622, 6, 16)) / (1000 * 60 * 60 * 24));
  const hijriYear = Math.floor(daysSinceEpoch / 354.367) + 1;
  const hijriDay = Math.floor(daysSinceEpoch % 354.367) + 1;
  const hijriMonthIndex = Math.floor((hijriDay - 1) / 29.53);
  
  return `${hijriDay} ${hijriMonthNames[hijriMonthIndex]} ${hijriYear + hijriAdjust} H`;
}

// ==========================
// Inisialisasi Tahun
// ==========================
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
YEARS.forEach(y => {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  yearSelect.appendChild(opt);
});

// Set default bulan & tahun
const today = new Date();
yearSelect.value = today.getFullYear();
monthSelect.value = today.getMonth() + 1;

// ==========================
// Load Data Jadwal Sholat - Enhanced
// ==========================
async function loadData() {
  const year = yearSelect.value;
  const month = monthSelect.value;
  
  console.log(`📅 Memuat jadwal: ${year}-${month}`);
  
  body.innerHTML = `
    <tr>
      <td colspan="9" style="text-align:center; padding:40px;">
        <div class="loader" style="margin: 0 auto 15px;"></div>
        <div style="font-size: 1.1rem; color: var(--gold); margin-bottom: 10px;">
          Memuat data jadwal sholat...
        </div>
        <div style="font-size: 0.9rem; opacity: 0.8;">
          Mushola Al-Ikhlas Pekunden
        </div>
      </td>
    </tr>
  `;

  try {
    // Coba dari GitHub Raw terlebih dahulu
    const githubRawUrl = `https://raw.githubusercontent.com/ReyLanTra/Jadwal-Sholat/public/kab-tegal/${year}.json`;
    console.log(`🔍 Mencoba dari GitHub: ${githubRawUrl}`);
    
    const res = await fetch(githubRawUrl, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!res.ok) {
      throw new Error(`GitHub: HTTP ${res.status}`);
    }
    
    const text = await res.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<')) {
      throw new Error('Response adalah HTML, bukan JSON');
    }
    
    const json = JSON.parse(text);
    console.log(`✅ Berhasil load dari GitHub`);
    
    // Validasi struktur JSON
    if (!json.time || typeof json.time !== 'object') {
      throw new Error('Format JSON tidak valid: properti "time" tidak ditemukan');
    }

    // Ambil data bulan yang dipilih
    const monthData = json.time[month];
    
    if (!monthData || !Array.isArray(monthData)) {
      body.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:40px; color: var(--gold);">
            <div style="font-size: 1.2rem; margin-bottom: 10px;">📭</div>
            <div style="font-size: 1.1rem;">Data untuk bulan ini belum tersedia</div>
            <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 10px;">
              Silakan pilih bulan lain
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Tampilkan info lokasi
    showLocationInfo(json);
    
    // Simpan data untuk prayer checking
    APP_STATE.prayerTimes = monthData;
    
    // Tampilkan data dengan highlight FIXED
    displayPrayerTimes(monthData, month, year);
    
    // Mulai checking waktu sholat
    startPrayerTimeChecking(monthData);
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    
    // Coba fallback ke Vercel
    try {
      const vercelUrl = `./kab-tegal/${year}.json`;
      console.log(`🔄 Fallback ke Vercel: ${vercelUrl}`);
      
      const res = await fetch(vercelUrl);
      if (res.ok) {
        const json = await res.json();
        const monthData = json.time[month];
        
        if (monthData) {
          showLocationInfo(json);
          APP_STATE.prayerTimes = monthData;
          displayPrayerTimes(monthData, month, year);
          startPrayerTimeChecking(monthData);
          return;
        }
      }
    } catch (fallbackError) {
      console.error('Fallback juga error:', fallbackError);
    }
    
    // Tampilkan error dengan UI yang baik
    body.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:50px;">
          <div style="font-size: 3rem; color: #ff6b6b; margin-bottom: 20px;">⚠️</div>
          <h3 style="color: #ff6b6b; margin-bottom: 15px;">Gagal Memuat Jadwal</h3>
          <p style="margin-bottom: 20px; opacity: 0.9;">${error.message}</p>
          <div style="background: rgba(255, 107, 107, 0.1); padding: 15px; border-radius: 10px; margin: 20px 0;">
            <strong>Solusi:</strong>
            <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
              <li>Pastikan file <code>${year}.json</code> ada di repository GitHub</li>
              <li>Periksa koneksi internet Anda</li>
              <li>Refresh halaman ini</li>
            </ul>
          </div>
          <button onclick="loadData()" style="
            margin-top: 20px; 
            padding: 12px 25px; 
            background: linear-gradient(135deg, var(--gold), #ffd700);
            border: none; 
            border-radius: 10px; 
            color: var(--dark); 
            font-weight: 700;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
          ">
            🔄 Coba Lagi
          </button>
        </td>
      </tr>
    `;
  }
}

// ==========================
// Tampilkan Data Jadwal - FIXED HIGHLIGHT
// ==========================
function displayPrayerTimes(monthData, month, year) {
  body.innerHTML = '';
  
  // PAKAI REAL-TIME DATE SETIAP KALI
  const now = new Date();
  const currentDate = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  console.log("🕒 REAL TIME CHECK:", {
    date: currentDate,
    month: currentMonth,
    year: currentYear,
    full: now.toLocaleDateString('id-ID')
  });
  
  monthData.forEach((day, index) => {
    // Parse tanggal dari data JSON
    let dayNumber = 0;
    let parsedMonth = 0;
    let parsedYear = 0;
    
    try {
      if (day.tanggal && typeof day.tanggal === 'string') {
        const parts = day.tanggal.split(', ');
        if (parts.length > 1) {
          const datePart = parts[1];
          const [d, m, y] = datePart.split('/').map(Number);
          dayNumber = d;
          parsedMonth = m;
          parsedYear = y;
        }
      }
    } catch (e) {
      console.warn(`⚠️ Error parsing date:`, e);
    }
    
    // Fallback ke index jika parsing gagal
    if (dayNumber === 0 || isNaN(dayNumber)) {
      dayNumber = index + 1;
    }
    
    // FIXED HIGHLIGHT LOGIC: Bandingkan dengan REAL TIME
    const isToday = (
      dayNumber === currentDate && 
      parsedMonth === currentMonth && 
      parsedYear === currentYear
    );
    
    // Simpan status
    if (isToday) {
      APP_STATE.isTodayHighlighted = true;
      console.log(`🎯 HIGHLIGHT APPLIED: Day ${dayNumber} is TODAY!`);
    }
    
    const tr = document.createElement('tr');
    
    // Hanya tambah class .today jika benar-benar hari ini
    if (isToday) {
      tr.classList.add('today');
      
      // Force CSS untuk memastikan visible
      tr.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(255, 215, 0, 0.2)) !important';
      tr.style.border = '3px solid #d4af37 !important';
      tr.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.6) !important';
    }
    
    // Clean waktu dengan regex untuk karakter aneh
    const cleanTime = (time) => {
      if (!time || time === 'undefined' || time === 'null') {
        return '--:--';
      }
      return time.toString()
        .replace(/[Il|]/gi, '1')    // I, l, | → 1
        .replace(/[Oo]/g, '0')      // O, o → 0
        .replace(/[Zz]/g, '2')      // Z, z → 2
        .replace(/[Ss]/g, '5')      // S, s → 5
        .trim();
    };
    
    // Hitung waktu Dhuha (15 menit setelah terbit)
    const calculateDhuha = (terbitTime) => {
      if (!terbitTime || terbitTime === '--:--') return '--:--';
      
      try {
        const [hours, minutes] = terbitTime.split(':').map(Number);
        let dhuhaMinutes = minutes + 15;
        let dhuhaHours = hours;
        
        if (dhuhaMinutes >= 60) {
          dhuhaHours += 1;
          dhuhaMinutes -= 60;
        }
        
        return `${dhuhaHours.toString().padStart(2, '0')}:${dhuhaMinutes.toString().padStart(2, '0')}`;
      } catch {
        return '--:--';
      }
    };
    
    const dhuhaTime = calculateDhuha(cleanTime(day.terbit));
    
    tr.innerHTML = `
      <td>
        <div style="font-weight: ${isToday ? '800' : '600'};">
          ${dayNumber}
          ${isToday ? '<span style="color: #FFD700; margin-left: 5px;">★</span>' : ''}
        </div>
      </td>
      <td><div class="prayer-time">${cleanTime(day.imsak)}</div></td>
      <td><div class="prayer-time">${cleanTime(day.subuh)}</div></td>
      <td><div class="prayer-time">${cleanTime(day.terbit)}</div></td>
      <td><div class="prayer-time">${dhuhaTime}</div></td>
      <td><div class="prayer-time">${cleanTime(day.dzuhur)}</div></td>
      <td><div class="prayer-time">${cleanTime(day.ashar)}</div></td>
      <td><div class="prayer-time">${cleanTime(day.maghrib)}</div></td>
      <td><div class="prayer-time">${cleanTime(day.isya)}</div></td>
    `;
    
    body.appendChild(tr);
  });
  
  console.log(`✅ Displayed ${body.children.length} rows, Today highlighted: ${APP_STATE.isTodayHighlighted}`);
}

// ==========================
// Tampilkan Info Lokasi
// ==========================
function showLocationInfo(json) {
  const oldInfo = document.querySelector('.location-info');
  if (oldInfo) oldInfo.remove();
  
  const infoDiv = document.createElement('div');
  infoDiv.className = 'location-info notification-panel';
  
  infoDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <div>
        <strong style="color: var(--gold); font-size: 1.1rem;">📍 ${json.city || 'KAB. TEGAL'}</strong>
        <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 5px;">
          ${json.province || json.procince || 'JAWA TENGAH'} • 
          Lintang: ${json.latitude || 'N/A'} • 
          Bujur: ${json.longitude || json.longtitude || 'N/A'}
        </div>
      </div>
      <div style="
        font-size: 0.85rem; 
        background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
        padding: 8px 15px; 
        border-radius: 20px; 
        border: 1px solid rgba(212, 175, 55, 0.3);
      ">
        <span style="color: var(--gold);">📋</span> Sumber: Kemenag RI
      </div>
    </div>
  `;
  
  const container = document.querySelector('.container');
  const table = document.querySelector('table');
  if (container && table) {
    container.insertBefore(infoDiv, table);
  }
}

// ==========================
// Audio Adzan System
// ==========================
function playAdzan(prayerName) {
  if (!CONFIG.audioEnabled) {
    console.log('🔇 Audio dimatikan, skipping adzan');
    return;
  }
  
  // Cegah pemutaran berulang untuk sholat yang sama dalam 1 menit
  const now = Date.now();
  const lastPlayed = APP_STATE.lastPrayerPlayed;
  
  if (lastPlayed && lastPlayed.prayer === prayerName && (now - lastPlayed.time) < 60000) {
    console.log(`⏭️ Skipping ${prayerName} adzan (already played recently)`);
    return;
  }
  
  // Tentukan file audio
  const audioFile = prayerName === 'subuh' 
    ? CONFIG.adzanFiles.subuh 
    : CONFIG.adzanFiles.default;
  
  const audioPath = `${CONFIG.audioPath}${audioFile}`;
  
  console.log(`🎵 Playing adzan for ${prayerName}: ${audioPath}`);
  
  // Hentikan audio sebelumnya jika masih playing
  if (APP_STATE.currentAudio) {
    APP_STATE.currentAudio.pause();
    APP_STATE.currentAudio.currentTime = 0;
  }
  
  // Buat audio baru
  const audio = new Audio(audioPath);
  APP_STATE.currentAudio = audio;
  APP_STATE.lastPrayerPlayed = { prayer: prayerName, time: now };
  
  audio.volume = 0.8;
  audio.preload = 'auto';
  
  audio.play().catch(error => {
    console.error('❌ Error playing audio:', error);
    
    // Fallback: Coba file lain jika ada
    if (prayerName === 'subuh') {
      console.log('🔄 Trying fallback for subuh adzan...');
      const fallbackAudio = new Audio(`${CONFIG.audioPath}${CONFIG.adzanFiles.default}`);
      fallbackAudio.volume = 0.8;
      fallbackAudio.play().catch(e => console.error('Fallback juga gagal:', e));
    }
  });
  
  // Update UI untuk menunjukkan audio sedang diputar
  showAudioPlayingIndicator(prayerName);
}

function showAudioPlayingIndicator(prayerName) {
  // Hapus indicator sebelumnya
  const oldIndicator = document.querySelector('.audio-playing-indicator');
  if (oldIndicator) oldIndicator.remove();
  
  const indicator = document.createElement('div');
  indicator.className = 'audio-playing-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: linear-gradient(135deg, var(--gold), #ffd700);
    color: var(--dark);
    padding: 15px 20px;
    border-radius: 15px;
    z-index: 1000;
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.5);
    animation: slideInUp 0.5s ease;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 300px;
  `;
  
  const prayerNames = {
    imsak: 'Imsak',
    subuh: 'Subuh',
    dzuhur: 'Dzuhur',
    ashar: 'Ashar',
    maghrib: 'Maghrib',
    isya: 'Isya'
  };
  
  indicator.innerHTML = `
    <span style="font-size: 1.5rem;">🕌</span>
    <div>
      <div style="font-size: 1.1rem;">Adzan ${prayerNames[prayerName] || prayerName}</div>
      <div style="font-size: 0.8rem; opacity: 0.9;">Sedang diputar...</div>
    </div>
  `;
  
  document.body.appendChild(indicator);
  
  // Auto hide setelah 5 detik
  setTimeout(() => {
    indicator.style.animation = 'slideOutDown 0.5s ease';
    setTimeout(() => indicator.remove(), 500);
  }, 5000);
}

// ==========================
// Browser Notifications System
// ==========================
async function setupNotifications() {
  if (!('Notification' in window)) {
    console.log('❌ Browser tidak mendukung notifications');
    return;
  }
  
  // Request permission
  if (Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      APP_STATE.notificationPermission = permission;
      console.log(`🔔 Notification permission: ${permission}`);
      
      if (permission === 'granted') {
        showNotification('Notifikasi Diaktifkan', 'Anda akan menerima notifikasi saat waktu sholat tiba.');
        
        // Register Service Worker untuk background notifications
        registerServiceWorker();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  } else {
    APP_STATE.notificationPermission = Notification.permission;
  }
}

function showNotification(title, message, prayerName = '') {
  if (!CONFIG.notificationsEnabled || APP_STATE.notificationPermission !== 'granted') {
    return;
  }
  
  const icon = prayerName === 'subuh' 
    ? 'assets/logo.png' 
    : 'assets/logo.png';
  
  const notification = new Notification(title, {
    body: message,
    icon: icon,
    badge: 'assets/logo.png',
    tag: `sholat-${prayerName}-${Date.now()}`,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200]
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  // Auto close setelah 10 detik
  setTimeout(() => notification.close(), 10000);
  
  return notification;
}

// ==========================
// Service Worker untuk Background Notifications
// ==========================
async function registerServiceWorker() {
  if ('serviceWorker' in navigator && !APP_STATE.serviceWorkerRegistered) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
      APP_STATE.serviceWorkerRegistered = true;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
}

// ==========================
// Prayer Time Checking System
// ==========================
let prayerCheckInterval = null;

function startPrayerTimeChecking(monthData) {
  // Hentikan interval sebelumnya jika ada
  if (prayerCheckInterval) {
    clearInterval(prayerCheckInterval);
  }
  
  prayerCheckInterval = setInterval(() => {
    checkCurrentPrayerTime(monthData);
  }, CONFIG.checkPrayerInterval);
}

function checkCurrentPrayerTime(monthData) {
  const now = new Date();
  const currentDate = now.getDate();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Dalam menit
  
  // Cari data untuk hari ini
  const todayData = monthData.find(day => {
    try {
      if (day.tanggal && typeof day.tanggal === 'string') {
        const parts = day.tanggal.split(', ');
        if (parts.length > 1) {
          const datePart = parts[1];
          const [d] = datePart.split('/').map(Number);
          return d === currentDate;
        }
      }
      return false;
    } catch {
      return false;
    }
  });
  
  if (!todayData) return;
  
  // Daftar waktu sholat untuk dicek
  const prayerTimes = [
    { name: 'imsak', time: todayData.imsak },
    { name: 'subuh', time: todayData.subuh },
    { name: 'dzuhur', time: todayData.dzuhur },
    { name: 'ashar', time: todayData.ashar },
    { name: 'maghrib', time: todayData.maghrib },
    { name: 'isya', time: todayData.isya }
  ];
  
  prayerTimes.forEach(prayer => {
    if (!prayer.time) return;
    
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTimeInMinutes = hours * 60 + minutes;
    const timeDiff = Math.abs(currentTime - prayerTimeInMinutes);
    
    // Jika waktu sholat tepat atau dalam toleransi 1 menit
    if (timeDiff <= 1) {
      const prayerDisplayName = {
        imsak: 'Imsak',
        subuh: 'Subuh',
        dzuhur: 'Dzuhur',
        ashar: 'Ashar',
        maghrib: 'Maghrib',
        isya: 'Isya'
      }[prayer.name];
      
      console.log(`🕌 Waktu ${prayerDisplayName} tiba!`);
      
      // Mainkan audio adzan
      playAdzan(prayer.name);
      
      // Tampilkan notifikasi browser
      if (CONFIG.notificationsEnabled) {
        showNotification(
          `Waktu Sholat ${prayerDisplayName}`,
          `Waktu sholat ${prayerDisplayName} telah tiba. Mari tunaikan sholat berjamaah.`,
          prayer.name
        );
      }
      
      // Highlight prayer time di tabel
      highlightCurrentPrayer(prayer.name);
    }
  });
}

function highlightCurrentPrayer(prayerName) {
  // Reset highlight sebelumnya
  document.querySelectorAll('.prayer-time.current').forEach(el => {
    el.classList.remove('current');
  });
  
  // Cari kolom yang sesuai dengan prayer time
  const prayerIndex = {
    imsak: 1,
    subuh: 2,
    dzuhur: 5,
    ashar: 6,
    maghrib: 7,
    isya: 8
  }[prayerName];
  
  if (prayerIndex !== undefined) {
    // Highlight di semua baris untuk sholat ini
    document.querySelectorAll(`tbody tr`).forEach(tr => {
      const td = tr.children[prayerIndex];
      if (td) {
        const prayerTimeDiv = td.querySelector('.prayer-time');
        if (prayerTimeDiv) {
          prayerTimeDiv.classList.add('current');
          
          // Auto remove highlight setelah 5 menit
          setTimeout(() => {
            prayerTimeDiv.classList.remove('current');
          }, 5 * 60 * 1000);
        }
      }
    });
  }
}

// ==========================
// Toggle Controls
// ==========================
function toggleAudio() {
  CONFIG.audioEnabled = !CONFIG.audioEnabled;
  showNotification(
    'Audio Adzan',
    CONFIG.audioEnabled ? 'Audio adzan diaktifkan' : 'Audio adzan dimatikan'
  );
  updateDateInfo(new Date()); // Refresh UI
}

function toggleNotifications() {
  CONFIG.notificationsEnabled = !CONFIG.notificationsEnabled;
  showNotification(
    'Notifikasi',
    CONFIG.notificationsEnabled ? 'Notifikasi diaktifkan' : 'Notifikasi dimatikan'
  );
  updateDateInfo(new Date());
}

// ==========================
// Hover & Effects
// ==========================
function addHoverEffects() {
  document.querySelectorAll('select, .clock-box, .prayer-time, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'translateY(-4px) scale(1.02)';
      el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translateY(0) scale(1)';
    });
  });
}

function initParallax() {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const bg = document.querySelector('.bg-animation');
    if (bg) {
      bg.style.transform = `translateY(${scrolled * -0.2}px)`;
    }
  });
}

// ==========================
// Date Change Detection
// ==========================
let lastCheckedDate = new Date().getDate();

function checkForDateChange() {
  const currentDate = new Date().getDate();
  
  if (currentDate !== lastCheckedDate) {
    console.log(`📅 Tanggal berubah: ${lastCheckedDate} → ${currentDate}`);
    lastCheckedDate = currentDate;
    
    showDateChangeNotification(currentDate);
    
    setTimeout(() => {
      console.log("🔄 Reloading data karena tanggal berubah...");
      loadData();
    }, 1000);
  }
}

function showDateChangeNotification(newDate) {
  const oldNotif = document.querySelector('.date-change-notif');
  if (oldNotif) oldNotif.remove();
  
  const notification = document.createElement('div');
  notification.className = 'date-change-notif';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, var(--gold), #ffd700);
    color: var(--dark);
    padding: 15px 25px;
    border-radius: 15px;
    z-index: 10000;
    box-shadow: 0 15px 35px rgba(212, 175, 55, 0.5);
    animation: slideInRight 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    font-weight: 800;
    max-width: 350px;
    border: 2px solid rgba(255, 255, 255, 0.3);
  `;
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const now = new Date();
  const monthName = monthNames[now.getMonth()];
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
      <span style="font-size: 2rem;">📅✨</span>
      <div>
        <div style="font-size: 1.2rem;">Tanggal Diperbarui!</div>
        <div style="font-size: 0.9rem; opacity: 0.9;">
          Sekarang: <strong>${newDate} ${monthName} ${now.getFullYear()}</strong>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// Tambah animasi CSS untuk notifications
const notificationAnimations = document.createElement('style');
notificationAnimations.textContent = `
  @keyframes slideInRight {
    from { 
      transform: translateX(100%) scale(0.8); 
      opacity: 0; 
    }
    to { 
      transform: translateX(0) scale(1); 
      opacity: 1; 
    }
  }
  @keyframes slideOutRight {
    from { 
      transform: translateX(0) scale(1); 
      opacity: 1; 
    }
    to { 
      transform: translateX(100%) scale(0.8); 
      opacity: 0; 
    }
  }
  @keyframes slideInUp {
    from { 
      transform: translateY(100%) scale(0.8); 
      opacity: 0; 
    }
    to { 
      transform: translateY(0) scale(1); 
      opacity: 1; 
    }
  }
  @keyframes slideOutDown {
    from { 
      transform: translateY(0) scale(1); 
      opacity: 1; 
    }
    to { 
      transform: translateY(100%) scale(0.8); 
      opacity: 0; 
    }
  }
`;
document.head.appendChild(notificationAnimations);

// ==========================
// Responsive Helper
// ==========================
function handleResponsive() {
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    document.querySelectorAll('.prayer-time').forEach(el => {
      el.style.fontSize = '0.85rem';
      el.style.padding = '5px 8px';
      el.style.minWidth = '55px';
    });
    
    document.querySelectorAll('thead th, tbody td').forEach(el => {
      el.style.padding = '12px 5px';
      el.style.fontSize = '0.9rem';
    });
  }
  
  const clockContainer = document.querySelector('.clock-container');
  if (clockContainer) {
    clockContainer.style.gap = isMobile ? '10px' : '20px';
    clockContainer.style.flexDirection = isMobile ? 'column' : 'row';
  }
}

// ==========================
// Inisialisasi Utama
// ==========================
async function init() {
  console.log('🕌 Initializing Enhanced Jadwal Sholat App...');
  
  // Tambah light rays effect
  const lightRays = document.createElement('div');
  lightRays.className = 'light-rays';
  document.body.appendChild(lightRays);
  
  // Inisialisasi komponen
  initParticles();
  updateClocks();
  addHoverEffects();
  initParallax();
  handleResponsive();
  
  // Setup notifications
  await setupNotifications();
  
  // Load data pertama kali
  await loadData();
  
  // Setup interval
  setInterval(updateClocks, 1000);
  setInterval(checkForDateChange, CONFIG.refreshInterval);
  
  // Event listeners
  yearSelect.addEventListener('change', loadData);
  monthSelect.addEventListener('change', loadData);
  window.addEventListener('resize', handleResponsive);
  
  // Register keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      loadData();
      showNotification('Refresh', 'Jadwal sholat diperbarui');
    }
    if (e.key === 'a' && e.ctrlKey) {
      e.preventDefault();
      toggleAudio();
    }
    if (e.key === 'n' && e.ctrlKey) {
      e.preventDefault();
      toggleNotifications();
    }
  });
  
  console.log("✅ App initialized successfully!");
}

// ==========================
// Jalankan Aplikasi
// ==========================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Ekspor untuk debugging
window.JadwalSholatApp = {
  loadData,
  updateClocks,
  playAdzan,
  toggleAudio,
  toggleNotifications,
  checkCurrentPrayerTime,
  CONFIG,
  APP_STATE
};
