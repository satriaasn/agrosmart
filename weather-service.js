/**
 * AgroSmart Weather Service
 * Mengambil data cuaca dari Open-Meteo (Tanpa API Key)
 */

const WeatherService = {
  cache: {},
  
  /**
   * Mengambil cuaca berdasarkan koordinat
   * @param {number} lat 
   * @param {number} lng 
   * @param {boolean} force - Lewati cache
   */
  async getForecast(lat, lng, force = false) {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const now = Date.now();
    
    // Cache valid selama 30 menit
    if (!force && this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp < 1800000)) {
      return this.cache[cacheKey].data;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengambil data cuaca');
      
      const data = await response.json();
      
      const result = {
        current: {
          temp: Math.round(data.current.temperature_2m),
          humid: data.current.relative_humidity_2m,
          feels: Math.round(data.current.apparent_temperature),
          wind: data.current.wind_speed_10m,
          rain: data.current.rain,
          code: data.current.weather_code,
          icon: this.getIcon(data.current.weather_code),
          desc: this.getDescription(data.current.weather_code)
        },
        daily: data.daily.time.map((t, i) => ({
          date: t,
          day: new Date(t).toLocaleDateString('id-ID', { weekday: 'long' }),
          shortDay: new Date(t).toLocaleDateString('id-ID', { weekday: 'short' }),
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weather_code[i],
          icon: this.getIcon(data.daily.weather_code[i]),
          rainProb: data.daily.precipitation_probability_max[i],
          rainSum: data.daily.precipitation_sum[i]
        }))
      };

      this.cache[cacheKey] = {
        timestamp: now,
        data: result
      };

      return result;
    } catch (err) {
      console.error('[WeatherService] Error:', err);
      return null;
    }
  },

  /**
   * Mendapatkan lokasi user via GPS Browser
   */
  getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser ini'));
      } else {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          err => reject(err),
          { timeout: 10000 }
        );
      }
    });
  },

  /**
   * Mapping Weather Code ke Emoji
   */
  getIcon(code) {
    if (code === 0) return '☀️'; // Clear sky
    if (code >= 1 && code <= 3) return '⛅'; // Mainly clear, partly cloudy, and overcast
    if (code >= 45 && code <= 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Drizzle, Rain, Freezing Rain
    if (code >= 71 && code <= 77) return '❄️'; // Snow fall, Snow grains
    if (code >= 80 && code <= 82) return '🌦️'; // Rain showers
    if (code >= 85 && code <= 86) return '🌨️'; // Snow showers
    if (code >= 95 && code <= 99) return '⛈️'; // Thunderstorm
    return '🌡️';
  },

  /**
   * Mapping Weather Code ke Deskripsi Bahasa Indonesia
   */
  getDescription(code) {
    if (code === 0) return 'Cerah';
    if (code === 1) return 'Cerah Berawan';
    if (code === 2) return 'Sebagian Berawan';
    if (code === 3) return 'Berawan';
    if (code >= 45 && code <= 48) return 'Kabut';
    if (code >= 51 && code <= 55) return 'Gerimis';
    if (code >= 61 && code <= 65) return 'Hujan';
    if (code >= 80 && code <= 82) return 'Hujan Ringan';
    if (code >= 95) return 'Badai Petir';
    return 'Normal';
  }
};

window.WeatherService = WeatherService;
