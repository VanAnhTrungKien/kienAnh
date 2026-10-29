/* ==========================================================================
   Thiệp cưới · Lê Thị Vân Anh & Nguyễn Trung Kiên
   Interactions: cover, countdown, calendar, carousel, gallery, lightbox,
   guestbook, RSVP, lazy map, toast.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PHOTOS = Array.isArray(window.WEDDING_PHOTOS) ? window.WEDDING_PHOTOS : [];

  /* Config -----------------------------------------------------------------
     GIFT: add bank details here to enable the gift box + VietQR.
     GUESTBOOK_ENDPOINT / RSVP_ENDPOINT: optional Google Apps Script URL.
  ------------------------------------------------------------------------- */
  var GIFT = {
    bankCode: "",
    accountNumber: "",
    accountName: "",
    bankName: ""
  };
  var ENDPOINTS = window.WEDDING_ENDPOINTS || {};
  var GUESTBOOK_ENDPOINT = ENDPOINTS.guestbook || "";
  var RSVP_ENDPOINT = ENDPOINTS.rsvp || "";

  var WISH_KEY = "va-kien-wishes-v1";
  var RSVP_KEY = "va-kien-rsvp-v1";

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2800);
  }

  function safeParse(value, fallback) {
    try {
      var parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function readStore(key, fallback) {
    try {
      return safeParse(window.localStorage.getItem(key), fallback);
    } catch (err) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function formatWishTime(timestamp) {
    var date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "";
    }
    return (
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds()) +
      " " +
      date.getDate() +
      "/" +
      (date.getMonth() + 1) +
      "/" +
      date.getFullYear()
    );
  }

  function postJson(url, payload) {
    if (!url) {
      return Promise.resolve();
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function postForm(url, payload) {
    if (!url) {
      return Promise.resolve();
    }

    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (key) {
      if (payload[key] !== undefined && payload[key] !== null) {
        body.append(key, payload[key]);
      }
    });

    return fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
  }

  function updateEndpointNotes() {
    var rsvpNote = document.getElementById("rsvpNote");
    var wishNote = document.getElementById("wishNote");

    if (rsvpNote) {
      rsvpNote.textContent = RSVP_ENDPOINT
        ? "Thông tin sẽ được gửi đến cô dâu."
        : "Thông tin được lưu trên thiết bị của bạn.";
    }
    if (wishNote) {
      wishNote.textContent = GUESTBOOK_ENDPOINT
        ? "Lời chúc sẽ được gửi đến cô dâu và hiển thị cho mọi người."
        : "Lời chúc được lưu trên thiết bị của bạn.";
    }
  }

  updateEndpointNotes();

  var YT_VIDEO_ID = "0Q8KsWGQn2E";
  var musicToggle = document.getElementById("musicToggle");
  var musicHost = document.getElementById("musicPlayer");
  var ytPlayer = null;
  var ytReady = false;
  var musicWanted = true;
  var musicPausedByUser = false;

  function setMusicPlaying(playing) {
    if (!musicToggle) {
      return;
    }
    musicToggle.classList.toggle("is-playing", playing);
    musicToggle.setAttribute("aria-pressed", playing ? "true" : "false");
    musicToggle.setAttribute("aria-label", playing ? "Tắt nhạc nền" : "Bật nhạc nền");
  }

  function ensureMusicPlayer() {
    if (ytPlayer || !musicHost || !window.YT || typeof window.YT.Player !== "function") {
      return;
    }

    ytPlayer = new window.YT.Player("musicPlayer", {
      height: "1",
      width: "1",
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: YT_VIDEO_ID,
        playsinline: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: function () {
          ytReady = true;
          if (typeof ytPlayer.setVolume === "function") {
            ytPlayer.setVolume(35);
          }
          if (musicWanted && !musicPausedByUser) {
            ytPlayer.playVideo();
          }
        },
        onStateChange: function (event) {
          if (!window.YT || !window.YT.PlayerState) {
            return;
          }
          if (event.data === window.YT.PlayerState.PLAYING) {
            setMusicPlaying(true);
          } else if (
            event.data === window.YT.PlayerState.PAUSED ||
            event.data === window.YT.PlayerState.ENDED
          ) {
            setMusicPlaying(false);
          }
        },
        onError: function () {
          setMusicPlaying(false);
        }
      }
    });
  }

  function playBackgroundMusic() {
    musicWanted = true;
    musicPausedByUser = false;
    ensureMusicPlayer();
    if (ytPlayer && ytReady) {
      ytPlayer.playVideo();
    }
  }

  function pauseBackgroundMusic() {
    musicWanted = false;
    musicPausedByUser = true;
    if (ytPlayer && ytReady) {
      ytPlayer.pauseVideo();
    }
    setMusicPlaying(false);
  }

  function unlockBackgroundMusic(event) {
    if (event && event.target && event.target.closest && event.target.closest("#musicToggle")) {
      return;
    }
    if (!musicWanted || musicPausedByUser) {
      return;
    }
    ensureMusicPlayer();
    if (ytPlayer && ytReady && ytPlayer.getPlayerState() !== 1) {
      ytPlayer.playVideo();
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener("click", function () {
      if (ytPlayer && ytReady && ytPlayer.getPlayerState() === 1) {
        pauseBackgroundMusic();
      } else {
        playBackgroundMusic();
      }
    });
  }

  window.addEventListener("youtube-api-ready", function () {
    ensureMusicPlayer();
    unlockBackgroundMusic();
  });
  document.addEventListener("pointerdown", unlockBackgroundMusic, { passive: true });
  document.addEventListener("keydown", unlockBackgroundMusic);
  ensureMusicPlayer();
  unlockBackgroundMusic();

  /* ----------------------------------------------------------------------
     Cover
     ---------------------------------------------------------------------- */

  var cover = document.getElementById("cover");
  var coverGuest = document.getElementById("coverGuest");
  var openBtn = document.getElementById("openInvitation");
  var page = document.getElementById("page");
  var main = document.getElementById("main");
  var coverOpened = false;

  var searchParams = null;
  try {
    searchParams = new URLSearchParams(window.location.search);
  } catch (err) {
    searchParams = null;
  }

  var skipCover = searchParams ? searchParams.get("open") === "1" : false;
  var guestName = "";
  if (searchParams) {
    guestName = (searchParams.get("guest") || searchParams.get("ten") || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }

  if (guestName && coverGuest) {
    coverGuest.textContent = guestName;
    coverGuest.hidden = false;
    document.title = "Thân mời " + guestName + " · Vân Anh & Trung Kiên";
  }

  function finishOpen() {
    if (coverOpened) {
      return;
    }
    coverOpened = true;

    if (cover) {
      cover.hidden = true;
      cover.setAttribute("aria-hidden", "true");
    }
    root.classList.remove("is-locked");

    if (page) {
      page.removeAttribute("inert");
    }
    if (main) {
      main.focus({ preventScroll: true });
    }
  }

  function openInvitation() {
    if (!cover || coverOpened) {
      return;
    }

    if (!musicPausedByUser) {
      playBackgroundMusic();
    }

    cover.setAttribute("aria-hidden", "true");
    cover.inert = true;
    cover.style.pointerEvents = "none";
    cover.classList.add("is-open");

    if (reduceMotion) {
      finishOpen();
      return;
    }
    window.setTimeout(finishOpen, 820);
  }

  if (cover) {
    if (skipCover) {
      cover.hidden = true;
      cover.setAttribute("aria-hidden", "true");
      if (page) {
        page.removeAttribute("inert");
      }
      root.classList.remove("is-locked");
      coverOpened = true;
    } else {
      root.classList.add("is-locked");
      if (page) {
        page.setAttribute("inert", "");
      }
      if (openBtn) {
        openBtn.addEventListener("click", openInvitation);
        window.setTimeout(function () {
          openBtn.focus({ preventScroll: true });
        }, 80);
      }
    }
  }

  /* ----------------------------------------------------------------------
     Countdown
     ---------------------------------------------------------------------- */

  var target = new Date("2026-12-05T16:30:00+07:00").getTime();
  var countdownEl = document.getElementById("countdownText");
  var countdownTimer = 0;

  function tickCountdown() {
    if (!countdownEl) {
      return;
    }

    var diff = target - Date.now();
    if (diff <= 0) {
      countdownEl.textContent = "Hôm nay là ngày trọng đại!";
      if (countdownTimer) {
        window.clearInterval(countdownTimer);
        countdownTimer = 0;
      }
      return;
    }

    var total = Math.floor(diff / 1000);
    var days = Math.floor(total / 86400);
    var hours = Math.floor(total / 3600) % 24;
    var minutes = Math.floor(total / 60) % 60;
    var seconds = total % 60;

    countdownEl.textContent =
      days + " ngày " + hours + " giờ " + minutes + " phút " + seconds + " giây";
  }

  tickCountdown();
  if (target - Date.now() > 0) {
    countdownTimer = window.setInterval(tickCountdown, 1000);
  }

  /* ----------------------------------------------------------------------
     Mini calendar — December 2026, highlight 05
     ---------------------------------------------------------------------- */

  function buildCalendar() {
    var calendar = document.getElementById("calendar");
    if (!calendar) {
      return;
    }

    var year = 2026;
    var month = 11;
    var highlight = 5;

    calendar.textContent = "";

    var title = document.createElement("p");
    title.className = "cal__title";
    title.textContent = "Tháng 12 / 2026";
    calendar.appendChild(title);

    var week = document.createElement("div");
    week.className = "cal__week";
    ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach(function (label) {
      var cell = document.createElement("span");
      cell.textContent = label;
      week.appendChild(cell);
    });
    calendar.appendChild(week);

    var grid = document.createElement("div");
    grid.className = "cal__grid";

    var firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    var offset = (firstDay + 6) % 7;
    var daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    for (var i = 0; i < offset; i += 1) {
      var blank = document.createElement("span");
      blank.className = "cal__cell";
      blank.setAttribute("aria-hidden", "true");
      grid.appendChild(blank);
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      var cell = document.createElement("span");
      cell.className = "cal__cell";
      cell.setAttribute("aria-label", "Ngày " + day + " tháng 12 năm 2026");

      if (day === highlight) {
        cell.classList.add("cal__cell--special");

        var heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        heart.setAttribute("class", "cal__heart");
        heart.setAttribute("viewBox", "0 0 24 24");
        heart.setAttribute("aria-hidden", "true");
        var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#icon-heart");
        heart.appendChild(use);
        cell.appendChild(heart);

        var number = document.createElement("b");
        number.textContent = String(day);
        cell.appendChild(number);
      } else {
        cell.textContent = String(day);
      }

      grid.appendChild(cell);
    }

    calendar.appendChild(grid);
  }

  buildCalendar();

  /* ----------------------------------------------------------------------
     Carousel
     ---------------------------------------------------------------------- */

  var CAROUSEL_INDICES = PHOTOS.map(function (_, index) {
    return index;
  });
  var CAROUSEL_PAGE_SIZE = 8;
  var carousel = document.getElementById("carousel");
  var stage = document.getElementById("carouselStage");
  var dotsWrap = document.getElementById("carouselDots");
  var carouselItems = [];
  var carouselDots = [];
  var carouselIndex = 0;
  var carouselPrev = null;
  var carouselNext = null;

  function carouselOffsets(index) {
    var total = carouselItems.length;
    var off = index - carouselIndex;
    if (off > total / 2) {
      off -= total;
    }
    if (off < -total / 2) {
      off += total;
    }
    return off;
  }

  function updateCarouselImages() {
    if (!carouselItems.length) {
      return;
    }

    carouselItems.forEach(function (item, index) {
      var img = item.querySelector("img");
      if (!img) {
        return;
      }

      var off = carouselOffsets(index);
      var src = img.getAttribute("data-src") || "";

      if (Math.abs(off) <= 4) {
        if (!img.getAttribute("src") && src) {
          img.src = src;
          img.loading = "eager";
        }
      } else if (img.getAttribute("src")) {
        img.removeAttribute("src");
      }
    });
  }

  function layoutCarousel() {
    if (!carousel || !carouselItems.length) {
      return;
    }

    updateCarouselImages();

    var width = carousel.clientWidth;
    var wide = width >= 700;
    var step = wide ? 160 : 124;
    var depth = wide ? 80 : 70;
    var rotation = wide ? 30 : 28;

    carouselItems.forEach(function (item, index) {
      var off = carouselOffsets(index);
      var abs = Math.abs(off);
      var visible = abs <= 3;
      var z = abs === 0 ? 0 : -depth * abs;
      var rot = Math.sign(off) * Math.min(46, abs * rotation);
      var scale = Math.max(0.48, 1 - abs * 0.16);

      item.style.transform =
        "translateX(" +
        off * step +
        "px) translateZ(" +
        z +
        "px) rotateY(" +
        -rot +
        "deg) scale(" +
        scale +
        ")";
      item.style.opacity = visible ? String(Math.max(0.14, 1 - abs * 0.3)) : "0";
      item.style.zIndex = String(10 - abs);
      item.style.pointerEvents = visible ? "auto" : "none";
      item.setAttribute("aria-hidden", visible ? "false" : "true");
      item.tabIndex = off === 0 ? 0 : -1;
    });

    var activePage = Math.floor(carouselIndex / CAROUSEL_PAGE_SIZE);
    carouselDots.forEach(function (dot, index) {
      var active = index === activePage;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
      dot.tabIndex = active ? 0 : -1;
    });

  }

  function goToSlide(index) {
    if (!carouselItems.length) {
      return;
    }
    carouselIndex = (index + carouselItems.length) % carouselItems.length;
    layoutCarousel();
  }

  function buildCarousel() {
    if (!stage || !dotsWrap || !PHOTOS.length) {
      return;
    }

    var indices = CAROUSEL_INDICES.filter(function (index) {
      return index >= 0 && index < PHOTOS.length;
    });

    indices.forEach(function (photoIndex, position) {
      var photo = PHOTOS[photoIndex];

      var item = document.createElement("button");
      item.type = "button";
      item.className = "carousel__item";
      item.setAttribute("aria-label", "Xem ảnh " + (photoIndex + 1));
      item.dataset.photoIndex = String(photoIndex);

      var img = document.createElement("img");
      img.dataset.src = photo.src;
      img.alt = "Ảnh cưới " + (photoIndex + 1);
      img.width = photo.w;
      img.height = photo.h;
      img.decoding = "async";
      img.loading = "eager";
      item.appendChild(img);

      item.addEventListener("click", function () {
        if (carouselOffsets(position) === 0) {
          openLightbox(photoIndex, item);
        } else {
          goToSlide(position);
        }
      });

      stage.appendChild(item);
      carouselItems.push(item);
    });

    var pageCount = Math.ceil(PHOTOS.length / CAROUSEL_PAGE_SIZE);
    for (var page = 0; page < pageCount; page += 1) {
      (function (pageIndex) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Nhóm ảnh " + (pageIndex + 1));
        dot.addEventListener("click", function () {
          goToSlide(pageIndex * CAROUSEL_PAGE_SIZE);
        });
        dotsWrap.appendChild(dot);
        carouselDots.push(dot);
      })(page);
    }

    if (carousel) {
      carouselPrev = document.createElement("button");
      carouselPrev.type = "button";
      carouselPrev.className = "carousel__nav carousel__nav--prev";
      carouselPrev.setAttribute("aria-label", "Ảnh trước");
      carouselPrev.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#icon-prev"></use></svg>';
      carouselPrev.addEventListener("click", function () {
        goToSlide(carouselIndex - 1);
      });
      carousel.appendChild(carouselPrev);

      carouselNext = document.createElement("button");
      carouselNext.type = "button";
      carouselNext.className = "carousel__nav carousel__nav--next";
      carouselNext.setAttribute("aria-label", "Ảnh sau");
      carouselNext.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#icon-next"></use></svg>';
      carouselNext.addEventListener("click", function () {
        goToSlide(carouselIndex + 1);
      });
      carousel.appendChild(carouselNext);

      var resizeTimer = 0;
      window.addEventListener("resize", function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(layoutCarousel, 120);
      });
    }

    layoutCarousel();
  }

  if (stage && dotsWrap) {
    buildCarousel();

    if (carousel) {
      carousel.tabIndex = 0;
      carousel.setAttribute("aria-label", "Album ảnh cưới, dùng phím trái phải để xem ảnh");

      carousel.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goToSlide(carouselIndex - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          goToSlide(carouselIndex + 1);
        }
      });

      var touchX = 0;
      var touchY = 0;
      var touchActive = false;

      carousel.addEventListener(
        "touchstart",
        function (event) {
          if (event.touches.length !== 1) {
            touchActive = false;
            return;
          }
          touchActive = true;
          touchX = event.touches[0].clientX;
          touchY = event.touches[0].clientY;
        },
        { passive: true }
      );

      carousel.addEventListener(
        "touchend",
        function (event) {
          if (!touchActive || !event.changedTouches.length) {
            touchActive = false;
            return;
          }
          var dx = event.changedTouches[0].clientX - touchX;
          var dy = event.changedTouches[0].clientY - touchY;
          touchActive = false;

          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            goToSlide(dx < 0 ? carouselIndex + 1 : carouselIndex - 1);
          }
        },
        { passive: true }
      );
    }
  }

  /* ----------------------------------------------------------------------
     Gallery modal
     ---------------------------------------------------------------------- */

  var galleryModal = document.getElementById("galleryModal");
  var photoGrid = document.getElementById("photoGrid");
  var galleryCount = document.getElementById("galleryCount");
  var openGalleryBtn = document.getElementById("openGallery");
  var galleryClose = document.getElementById("galleryClose");
  var galleryScroll = document.getElementById("galleryScroll");
  var galleryBuilt = false;
  var galleryOpen = false;
  var galleryLastFocus = null;

  function buildPhotoGrid() {
    if (galleryBuilt || !photoGrid) {
      return;
    }
    galleryBuilt = true;

    PHOTOS.forEach(function (photo, index) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "photo-grid__item";
      item.setAttribute("aria-label", "Xem ảnh " + (index + 1));

      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = "Ảnh cưới " + (index + 1);
      img.width = photo.w;
      img.height = photo.h;
      img.loading = "lazy";
      img.decoding = "async";
      item.appendChild(img);

      item.addEventListener("click", function () {
        openLightbox(index, item);
      });

      photoGrid.appendChild(item);
    });

    if (galleryCount) {
      galleryCount.textContent = PHOTOS.length + " ảnh";
    }
    if (openGalleryBtn) {
      var label = openGalleryBtn.querySelector("span");
      if (label) {
        label.textContent = "Xem tất cả " + PHOTOS.length + " ảnh";
      }
    }
  }

  function openGalleryModal() {
    if (!galleryModal) {
      return;
    }
    buildPhotoGrid();
    galleryLastFocus = document.activeElement;
    galleryOpen = true;
    galleryModal.hidden = false;
    root.classList.add("gallery-open");
    if (galleryScroll) {
      galleryScroll.scrollTop = 0;
    }
    if (galleryClose) {
      galleryClose.focus({ preventScroll: true });
    }
  }

  function closeGalleryModal() {
    if (!galleryModal || !galleryOpen) {
      return;
    }
    galleryOpen = false;
    galleryModal.hidden = true;
    root.classList.remove("gallery-open");
    if (galleryLastFocus && typeof galleryLastFocus.focus === "function") {
      galleryLastFocus.focus({ preventScroll: true });
    }
  }

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener("click", openGalleryModal);
  }
  if (galleryClose) {
    galleryClose.addEventListener("click", closeGalleryModal);
  }

  /* ----------------------------------------------------------------------
     Lightbox
     ---------------------------------------------------------------------- */

  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCount = document.getElementById("lbCount");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var lbIndex = 0;
  var lightboxOpen = false;
  var lightboxLastFocus = null;
  var lightboxTimer = 0;

  function renderLightbox(index) {
    if (!lbImg || !PHOTOS.length) {
      return;
    }

    lbIndex = (index + PHOTOS.length) % PHOTOS.length;
    var photo = PHOTOS[lbIndex];

    lbImg.src = photo.src;
    lbImg.alt = "Ảnh cưới " + (lbIndex + 1);
    lbImg.width = photo.w;
    lbImg.height = photo.h;

    if (lbCount) {
      lbCount.textContent = lbIndex + 1 + " / " + PHOTOS.length;
    }

    [1, -1].forEach(function (offset) {
      var neighbor = PHOTOS[(lbIndex + offset + PHOTOS.length) % PHOTOS.length];
      var preload = new window.Image();
      preload.src = neighbor.src;
    });
  }

  function openLightbox(index, trigger) {
    if (!lightbox || !PHOTOS.length) {
      return;
    }

    window.clearTimeout(lightboxTimer);
    lightboxOpen = true;
    lightboxLastFocus = trigger || document.activeElement;

    lightbox.hidden = false;
    root.classList.add("lightbox-open");
    renderLightbox(index);

    window.requestAnimationFrame(function () {
      lightbox.classList.add("is-visible");
    });

    if (lbClose) {
      lbClose.focus({ preventScroll: true });
    }
  }

  function closeLightbox() {
    if (!lightbox || !lightboxOpen) {
      return;
    }
    lightboxOpen = false;
    lightbox.classList.remove("is-visible");
    root.classList.remove("lightbox-open");

    lightboxTimer = window.setTimeout(function () {
      lightbox.hidden = true;
      if (lbImg) {
        lbImg.removeAttribute("src");
      }
      if (lightboxLastFocus && typeof lightboxLastFocus.focus === "function") {
        lightboxLastFocus.focus({ preventScroll: true });
      }
    }, reduceMotion ? 0 : 240);
  }

  if (lbClose) {
    lbClose.addEventListener("click", closeLightbox);
  }
  if (lbPrev) {
    lbPrev.addEventListener("click", function () {
      renderLightbox(lbIndex - 1);
    });
  }
  if (lbNext) {
    lbNext.addEventListener("click", function () {
      renderLightbox(lbIndex + 1);
    });
  }
  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target && event.target.closest("[data-close]")) {
        closeLightbox();
      }
    });

    var lbTouchX = 0;
    var lbTouchY = 0;
    var lbTouchActive = false;

    lightbox.addEventListener(
      "touchstart",
      function (event) {
        if (event.touches.length !== 1) {
          lbTouchActive = false;
          return;
        }
        lbTouchActive = true;
        lbTouchX = event.touches[0].clientX;
        lbTouchY = event.touches[0].clientY;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchend",
      function (event) {
        if (!lbTouchActive || !event.changedTouches.length) {
          lbTouchActive = false;
          return;
        }
        var dx = event.changedTouches[0].clientX - lbTouchX;
        var dy = event.changedTouches[0].clientY - lbTouchY;
        lbTouchActive = false;

        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          renderLightbox(dx < 0 ? lbIndex + 1 : lbIndex - 1);
        }
      },
      { passive: true }
    );
  }

  /* ----------------------------------------------------------------------
     Modals (RSVP + gift)
     ---------------------------------------------------------------------- */

  var rsvpModal = document.getElementById("rsvpModal");
  var rsvpBtn = document.getElementById("rsvpBtn");
  var rsvpForm = document.getElementById("rsvpForm");
  var giftModal = document.getElementById("giftModal");
  var giftBtn = document.getElementById("giftBtn");
  var giftSection = document.getElementById("gift");
  var giftQr = document.getElementById("giftQr");

  var modalLastFocus = null;
  var activeModal = null;

  function focusableIn(container) {
    return Array.prototype.slice
      .call(
        container.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return el.offsetParent !== null;
      });
  }

  function openModal(modal, focusTarget) {
    if (!modal) {
      return;
    }
    modalLastFocus = document.activeElement;
    activeModal = modal;
    modal.hidden = false;
    root.classList.add("modal-open");

    var target = focusTarget || focusableIn(modal)[0];
    if (target) {
      target.focus({ preventScroll: true });
    }
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) {
      return;
    }
    modal.hidden = true;
    if (activeModal === modal) {
      activeModal = null;
    }
    if (!document.querySelector(".modal:not([hidden])")) {
      root.classList.remove("modal-open");
    }
    if (modalLastFocus && typeof modalLastFocus.focus === "function") {
      modalLastFocus.focus({ preventScroll: true });
    }
  }

  if (rsvpBtn && rsvpModal) {
    rsvpBtn.addEventListener("click", function () {
      openModal(rsvpModal, document.getElementById("rsvpName"));
    });
  }

  if (rsvpForm && rsvpModal) {
    rsvpForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var nameField = document.getElementById("rsvpName");
      var attendField = document.getElementById("rsvpAttend");
      var countField = document.getElementById("rsvpCount");

      var name = nameField ? nameField.value.trim() : "";
      var attend = attendField ? attendField.value : "";
      var count = countField ? countField.value : "";

      if (!name || !attend) {
        showToast("Vui lòng nhập tên và chọn câu trả lời.");
        return;
      }

      var entry = {
        action: "rsvp",
        name: name,
        attend: attend,
        count: count,
        guest: guestName,
        sentAt: Date.now()
      };

      var stored = readStore(RSVP_KEY, []);
      if (!Array.isArray(stored)) {
        stored = [];
      }
      stored.unshift(entry);
      writeStore(RSVP_KEY, stored.slice(0, 100));

      postForm(RSVP_ENDPOINT, entry).catch(function () {});

      rsvpForm.reset();
      closeModal(rsvpModal);
      showToast(
        RSVP_ENDPOINT
          ? "Đã gửi xác nhận. Cảm ơn bạn!"
          : "Đã lưu xác nhận trên thiết bị này."
      );
    });
  }

  if (giftSection && giftBtn && GIFT.bankCode && GIFT.accountNumber) {
    giftSection.hidden = false;

    giftBtn.addEventListener("click", function () {
      if (giftQr) {
        giftQr.textContent = "";
        var img = document.createElement("img");
        img.src =
          "https://img.vietqr.io/image/" +
          encodeURIComponent(GIFT.bankCode) +
          "-" +
          encodeURIComponent(GIFT.accountNumber) +
          "-compact2.png?amount=0&addInfo=" +
          encodeURIComponent("Mung cuoi Le Thi Van Anh");
        img.alt = "Mã QR chuyển khoản mừng cưới";
        img.loading = "lazy";
        giftQr.appendChild(img);

        var info = document.createElement("p");
        info.className = "modal__note";
        info.textContent = GIFT.bankName + " · " + GIFT.accountNumber + " · " + GIFT.accountName;
        giftQr.appendChild(info);
      }
      openModal(giftModal, document.querySelector("#giftModal .modal__close"));
    });
  }

  /* ----------------------------------------------------------------------
     Download / print QR (not used unless configured)
     ---------------------------------------------------------------------- */

  /* ----------------------------------------------------------------------
     Modal closing + focus trap
     ---------------------------------------------------------------------- */

  document.addEventListener("click", function (event) {
    var closer = event.target && event.target.closest("[data-close]");
    if (!closer) {
      return;
    }
    var modal = closer.closest(".modal");
    if (modal) {
      closeModal(modal);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (lightboxOpen) {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (galleryOpen && galleryModal) {
        event.preventDefault();
        closeGalleryModal();
        return;
      }
      if (activeModal) {
        event.preventDefault();
        closeModal(activeModal);
        return;
      }
    }

    if (event.key !== "Tab") {
      return;
    }

    var container = null;
    if (lightboxOpen) {
      container = lightbox;
    } else if (galleryOpen) {
      container = galleryModal;
    } else if (activeModal) {
      container = activeModal;
    }

    if (!container) {
      return;
    }

    var focusable = focusableIn(container);
    if (!focusable.length) {
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ----------------------------------------------------------------------
     Lightbox keyboard (arrows)
     ---------------------------------------------------------------------- */

  document.addEventListener("keydown", function (event) {
    if (!lightboxOpen) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      renderLightbox(lbIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      renderLightbox(lbIndex + 1);
    }
  });

  /* ----------------------------------------------------------------------
     Guestbook
     ---------------------------------------------------------------------- */

  var wishForm = document.getElementById("wishForm");
  var wishName = document.getElementById("wishName");
  var wishText = document.getElementById("wishText");
  var wishesEl = document.getElementById("wishes");
  var wishFocus = document.getElementById("wishFocus");
  var wishesCache = null;
  var pendingWishes = [];

  function loadWishes() {
    var list = readStore(WISH_KEY, []);
    if (Array.isArray(list) && list.length) {
      return list;
    }
    if (Array.isArray(wishesCache)) {
      return wishesCache;
    }
    return Array.isArray(list) ? list : [];
  }

  function renderWishes(list) {
    if (!wishesEl) {
      return;
    }

    var items = (list || loadWishes()).slice().sort(function (a, b) {
      return (b.time || 0) - (a.time || 0);
    });

    wishesEl.textContent = "";

    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "wish-empty";
      empty.textContent = "Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc đến cô dâu chú rể.";
      wishesEl.appendChild(empty);
      return;
    }

    items.slice(0, 50).forEach(function (wish) {
      var card = document.createElement("article");
      card.className = "wish";

      var head = document.createElement("div");
      head.className = "wish__head";

      var name = document.createElement("span");
      name.className = "wish__name";
      name.textContent = wish.name || "";

      var time = document.createElement("span");
      time.className = "wish__time";
      time.textContent = formatWishTime(wish.time);

      head.appendChild(name);
      head.appendChild(time);

      var text = document.createElement("p");
      text.className = "wish__text";
      text.textContent = wish.wish || "";

      card.appendChild(head);
      card.appendChild(text);
      wishesEl.appendChild(card);
    });
  }

  function mergeWishes(remote, local) {
    var merged = [];
    var seen = {};

    (remote || []).concat(local || []).forEach(function (wish) {
      var name = String(wish.name || "").trim();
      var text = String(wish.wish || "").trim();

      if (!name || !text) {
        return;
      }

      var key = name + "\u0000" + text;
      if (seen[key]) {
        return;
      }
      seen[key] = true;
      merged.push({
        name: name,
        wish: text,
        time: Number(wish.time) || 0
      });
    });

    return merged;
  }

  function mergeRemoteWishes(remote) {
    pendingWishes = pendingWishes.filter(function (pending) {
      return !remote.some(function (item) {
        return item.name === pending.name && item.wish === pending.wish;
      });
    });
    wishesCache = mergeWishes(remote, pendingWishes);
    renderWishes(wishesCache);
  }

  function loadRemoteWishes() {
    if (!GUESTBOOK_ENDPOINT) {
      return;
    }

    var callbackName = "weddingWishes" + Date.now() + Math.floor(Math.random() * 1000);
    var script = document.createElement("script");
    var timeout = window.setTimeout(cleanup, 8000);

    function cleanup() {
      window.clearTimeout(timeout);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      try {
        delete window[callbackName];
      } catch (err) {
        window[callbackName] = undefined;
      }
    }

    window[callbackName] = function (payload) {
      cleanup();
      if (!payload || !Array.isArray(payload.wishes)) {
        return;
      }
      mergeRemoteWishes(payload.wishes);
    };

    script.onerror = cleanup;
    script.src =
      GUESTBOOK_ENDPOINT +
      (GUESTBOOK_ENDPOINT.indexOf("?") === -1 ? "?" : "&") +
      "action=wishes&callback=" +
      encodeURIComponent(callbackName);
    document.body.appendChild(script);
  }

  if (wishForm) {
    wishForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = wishName ? wishName.value.trim() : "";
      var text = wishText ? wishText.value.trim() : "";

      if (!name || !text) {
        showToast("Vui lòng nhập tên và lời chúc.");
        return;
      }

      var entry = {
        action: "wish",
        name: name,
        wish: text,
        guest: guestName,
        time: Date.now()
      };

      pendingWishes.unshift(entry);
      var list = loadWishes();
      list.unshift(entry);
      wishesCache = list.slice(0, 50);
      writeStore(WISH_KEY, wishesCache);

      postForm(GUESTBOOK_ENDPOINT, entry).catch(function () {});
      window.setTimeout(loadRemoteWishes, 1500);

      wishForm.reset();
      renderWishes(wishesCache);
      showToast(
        GUESTBOOK_ENDPOINT
          ? "Đã gửi lời chúc. Cảm ơn bạn!"
          : "Đã lưu lời chúc trên thiết bị này."
      );
    });
  }

  if (wishFocus && wishName) {
    wishFocus.addEventListener("click", function () {
      wishName.focus();
    });
  }

  wishesCache = loadWishes();
  renderWishes(wishesCache);
  loadRemoteWishes();
  if (GUESTBOOK_ENDPOINT) {
    window.setInterval(loadRemoteWishes, 45000);
  }

  /* ----------------------------------------------------------------------
     Keyboard shortcuts for the carousel dots
     ---------------------------------------------------------------------- */

  if (dotsWrap) {
    dotsWrap.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(carouselIndex + (event.key === "ArrowRight" ? 1 : -1));
        if (carouselDots[carouselIndex]) {
          carouselDots[carouselIndex].focus();
        }
      }
    });
  }
})();
