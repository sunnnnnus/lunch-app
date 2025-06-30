    const weatherBox = document.getElementById("weather");
    const resultBox = document.getElementById("resultBox");
    const restaurantName = document.getElementById("restaurantName");
    const restaurantAddress = document.getElementById("restaurantAddress");
    const mapLink = document.getElementById("mapLink");

    const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;



    // 取得勾選的餐點類型
    function getSelectedCategories() {
      return Array.from(document.getElementById("typeSelect").selectedOptions)
                  .map(opt => opt.value);
    }


    // 取得天氣 + emoji
    function getWeatherEmoji(desc) {
        if (desc.includes("晴") || desc.includes("clear")) return "☀️";
        if (desc.includes("雲") || desc.includes("cloud")) return "⛅";
        if (desc.includes("雨") || desc.includes("rain")) return "🌧️";
        if (desc.includes("雷") || desc.includes("thunder")) return "⛈️";
        if (desc.includes("雪") || desc.includes("snow")) return "❄️";
        return "🌈";
        }

    function getWeather(lat, lon) {
    axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=zh_tw&appid=${WEATHER_API_KEY}`)
        .then(res => {
        const desc = res.data.weather[0].description;
        const temp = res.data.main.temp;
        const emoji = getWeatherEmoji(desc);
        weatherBox.innerHTML = `${emoji} ${temp.toFixed(1)}°C`;
        weatherBox.classList.remove("d-none");
        })
        .catch(err => {
        console.error("取得天氣失敗", err);
        });
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);


    // 推薦餐廳
    function recommendRestaurant(lat, lon, categories) {
      const mood = getUserMood();
      const userInput = document.getElementById("customKeyword").value.trim();
      let keywordParts = [];

      if (userInput !== "") {
        keywordParts.push(userInput);
      } else if (categories.length > 0) {
        keywordParts.push(...categories);
      } else {
        keywordParts.push("美食");
      }

      // 加入心情對應的食物關鍵字
      if (mood === "happy") {
        keywordParts.push("清淡", "輕食");
      } else if (mood === "sad") {
        keywordParts.push("重口味", "炸物", "辣");
      }

      const keyword = keywordParts.join(" ");

      // 讀取使用者選擇的搜尋半徑
      const radius = parseInt(document.getElementById("rangeSelect").value, 10);

      const userLocation = new google.maps.LatLng(lat, lon);
      const map = new google.maps.Map(document.getElementById("map"), {
        center: userLocation,
        zoom: 15,
      });

      const selectedPrice = document.getElementById("priceSelect").value;

      const service = new google.maps.places.PlacesService(map);
      const request = {
        location: userLocation,
        radius: radius, // 使用使用者選擇的距離
        keyword: keyword,
        type: 'restaurant'
      };

      if (selectedPrice) {
          request.maxPriceLevel = parseInt(selectedPrice);
      }

      service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
          let pick = results[Math.floor(Math.random() * results.length)];

          restaurantName.textContent = pick.name;
          restaurantAddress.textContent = pick.vicinity || pick.formatted_address;
          // mapLink.href = `https://www.google.com/maps/place/?q=place_id:${pick.place_id}`;

          // 顯示餐廳照片
          const photoBox = document.getElementById("photoBox");
          if (pick.photos && pick.photos.length > 0) {
            const photoUrl = pick.photos[0].getUrl({ maxWidth: 500, maxHeight: 300 });
            photoBox.innerHTML = `<img src="${photoUrl}" class="img-fluid rounded shadow-sm" alt="餐廳照片">`;
          } else {
            photoBox.innerHTML = `<div class="text-muted">這間店家暫無照片</div>`;
          }
          menuLink.href = `https://www.google.com/maps/place/?q=place_id:${pick.place_id}`;

          resultBox.classList.remove("d-none");
        }else {
          document.getElementById("errorBox").classList.remove("d-none");
          document.getElementById("resultBox").classList.add("d-none"); 
        }
        });
    }


    document.getElementById("recommendBtn").addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("您的瀏覽器不支援位置存取。請改用其他瀏覽器。");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords; //抓取定位
          const selectedCategories = getSelectedCategories();

          getWeather(latitude, longitude);
          recommendRestaurant(latitude, longitude, selectedCategories);
        },
        err => {
          console.error(err);
          alert("無法取得位置資訊，請檢查權限。");
        }
      );
    });

    // 畫面載入時顯示天氣
    window.addEventListener("load", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude, longitude } = pos.coords;
            getWeather(latitude, longitude); // 自動顯示天氣
        },
        err => {
            console.error("無法取得位置資訊", err);
        }
        );
    } else {
        console.warn("瀏覽器不支援地理位置功能");
    }
    });

    // 心情取得
    function getUserMood() {
      return document.getElementById("moodSelect").value;
    }
