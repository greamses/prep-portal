/* =============================================
   CAROUSEL CARD COMPONENT
   Reusable, swipeable, with arrow navigation
   ============================================= */

class CarouselCards {
  constructor(container, data, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    if (!this.container) {
      console.error("Carousel container not found");
      return;
    }

    this.data = data;
    this.options = {
      slidesPerView: options.slidesPerView || 4,
      gap: options.gap || 24,
      autoplay: options.autoplay || false,
      autoplayDelay: options.autoplayDelay || 3000,
      loop: options.loop || false,
      ...options,
    };

    this.currentIndex = 0;
    this.startX = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.autoplayInterval = null;
    this.totalSlides = this.data.length;

    this.init();
  }

  init() {
    this.buildCarousel();
    this.attachEvents();
    this.updateNavigation();

    if (this.options.autoplay) {
      this.startAutoplay();
    }
  }

  buildCarousel() {
    // Clear container
    this.container.innerHTML = "";

    // Create carousel wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "carousel-wrapper";

    // Create track
    this.track = document.createElement("div");
    this.track.className = "carousel-track";

    // Create slides
    this.data.forEach((item, index) => {
      const slide = this.createSlide(item, index);
      this.track.appendChild(slide);
    });

    wrapper.appendChild(this.track);

    // Create navigation arrows
    const prevBtn = document.createElement("button");
    prevBtn.className = "carousel-btn carousel-prev";
    prevBtn.setAttribute("aria-label", "Previous slide");
    prevBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="rotate(180 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="var(--accent-secondary)"/></g></svg>
    `;

    const nextBtn = document.createElement("button");
    nextBtn.className = "carousel-btn carousel-next";
    nextBtn.setAttribute("aria-label", "Next slide");
    nextBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="rotate(0 12 12)"><path d="M9.4 3.9 17 11.1a1.25 1.25 0 0 1 0 1.8L9.4 20.1a1.3 1.3 0 0 1-1.8-1.9L14 12 7.6 5.8a1.3 1.3 0 0 1 1.8-1.9z" fill="var(--accent-secondary)"/></g></svg>
    `;

    // Create indicators
    this.indicators = document.createElement("div");
    this.indicators.className = "carousel-indicators";

    for (let i = 0; i < this.totalSlides; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => this.goToSlide(i));
      this.indicators.appendChild(dot);
    }

    // Assemble
    this.container.appendChild(prevBtn);
    this.container.appendChild(wrapper);
    this.container.appendChild(nextBtn);
    this.container.appendChild(this.indicators);

    // Set initial position
    this.updateTrackPosition();
  }

  createSlide(item, index) {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";

    const card = document.createElement("div");
    card.className = "card";

    // Card Image (full width)
    if (item.image) {
      const imageWrap = document.createElement("div");
      imageWrap.className = "card-image";

      if (item.image.trim().startsWith("<svg")) {
        imageWrap.innerHTML = item.image;
      } else {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.title || "";
        imageWrap.appendChild(img);
      }

      card.appendChild(imageWrap);
    }

    // Card Content
    const content = document.createElement("div");
    content.className = "card-content";

    if (item.title) {
      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = item.title;
      content.appendChild(title);
    }

    if (item.description) {
      const desc = document.createElement("p");
      desc.className = "card-description";
      desc.textContent = item.description;
      content.appendChild(desc);
    }

    if (item.stats) {
      const stats = document.createElement("div");
      stats.className = "card-stats";

      item.stats.forEach((stat) => {
        const statItem = document.createElement("span");
        statItem.className = "card-stat";
        statItem.textContent = stat;
        stats.appendChild(statItem);
      });

      content.appendChild(stats);
    }

    card.appendChild(content);

    // Hover arrow
    const arrow = document.createElement("div");
    arrow.className = "card-arrow";
    arrow.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="rotate(90 12 12)"><rect x="10.6" y="9" width="2.8" height="12" rx="1.4" fill="var(--accent-secondary)"/><path d="M12 2.6 19.4 11H4.6z" fill="var(--accent-danger)"/></g></svg>`;
    card.appendChild(arrow);

    // Link
    if (item.href) {
      const link = document.createElement("a");
      link.href = item.href;
      link.className = "card-link";
      link.setAttribute("aria-label", item.title || "View details");
      link.appendChild(card);
      slide.appendChild(link);
    } else {
      slide.appendChild(card);
    }

    // Add click handler
    if (item.onClick) {
      slide.addEventListener("click", (e) => {
        if (!item.href) {
          e.preventDefault();
          item.onClick(item, index);
        }
      });
    }

    return slide;
  }

  attachEvents() {
    // Arrow navigation
    const prevBtn = this.container.querySelector(".carousel-prev");
    const nextBtn = this.container.querySelector(".carousel-next");

    prevBtn?.addEventListener("click", () => this.prev());
    nextBtn?.addEventListener("click", () => this.next());

    // Touch events for swipe
    this.track.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
      passive: true,
    });
    this.track.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: true,
    });
    this.track.addEventListener("touchend", () => this.handleTouchEnd());

    // Mouse events for drag
    this.track.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.track.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.track.addEventListener("mouseup", () => this.handleMouseUp());
    this.track.addEventListener("mouseleave", () => this.handleMouseUp());

    // Prevent context menu on drag
    this.track.addEventListener("contextmenu", (e) => {
      if (this.isDragging) e.preventDefault();
    });

    // Keyboard navigation
    this.container.setAttribute("tabindex", "0");
    this.container.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        this.next();
      }
    });

    // Autoplay pause on hover
    if (this.options.autoplay) {
      this.container.addEventListener("mouseenter", () => this.stopAutoplay());
      this.container.addEventListener("mouseleave", () => this.startAutoplay());
    }

    // Handle resize
    window.addEventListener("resize", () => this.updateTrackPosition());
  }

  handleTouchStart(e) {
    this.startX = e.touches[0].clientX;
    this.currentX = this.startX;
    this.isDragging = true;
    this.track.style.transition = "none";
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;
    this.currentX = e.touches[0].clientX;
    const diff = this.currentX - this.startX;
    const offset = -this.currentIndex * this.getSlideWidth() + diff;
    this.track.style.transform = `translateX(${offset}px)`;
  }

  handleTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.track.style.transition = "transform 0.3s ease";

    const diff = this.currentX - this.startX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.prev();
      } else {
        this.next();
      }
    } else {
      this.updateTrackPosition();
    }
  }

  handleMouseDown(e) {
    e.preventDefault();
    this.startX = e.clientX;
    this.currentX = this.startX;
    this.isDragging = true;
    this.track.style.transition = "none";
    this.track.style.cursor = "grabbing";
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    this.currentX = e.clientX;
    const diff = this.currentX - this.startX;
    const offset = -this.currentIndex * this.getSlideWidth() + diff;
    this.track.style.transform = `translateX(${offset}px)`;
  }

  handleMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.track.style.transition = "transform 0.3s ease";
    this.track.style.cursor = "grab";

    const diff = this.currentX - this.startX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.prev();
      } else {
        this.next();
      }
    } else {
      this.updateTrackPosition();
    }
  }

  getSlideWidth() {
    const slide = this.track.querySelector(".carousel-slide");
    if (!slide) return 300;
    return slide.offsetWidth + this.options.gap;
  }

  getMaxIndex() {
    const containerWidth = this.track.parentElement.offsetWidth;
    const slideWidth = this.getSlideWidth();
    const visibleSlides = Math.floor(containerWidth / slideWidth);
    return Math.max(0, this.totalSlides - visibleSlides);
  }

  updateTrackPosition() {
    const offset = -this.currentIndex * this.getSlideWidth();
    this.track.style.transform = `translateX(${offset}px)`;
    this.updateNavigation();
  }

  goToSlide(index) {
    const maxIndex = this.getMaxIndex();
    this.currentIndex = Math.max(0, Math.min(index, maxIndex));
    this.updateTrackPosition();
  }

  next() {
    const maxIndex = this.getMaxIndex();
    if (this.currentIndex < maxIndex) {
      this.currentIndex++;
    } else if (this.options.loop) {
      this.currentIndex = 0;
    }
    this.updateTrackPosition();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.options.loop) {
      this.currentIndex = this.getMaxIndex();
    }
    this.updateTrackPosition();
  }

  updateNavigation() {
    const maxIndex = this.getMaxIndex();
    const prevBtn = this.container.querySelector(".carousel-prev");
    const nextBtn = this.container.querySelector(".carousel-next");

    if (prevBtn) {
      prevBtn.disabled = this.currentIndex === 0 && !this.options.loop;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentIndex >= maxIndex && !this.options.loop;
    }

    // Update indicators
    const dots = this.indicators.querySelectorAll(".carousel-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === this.currentIndex);
    });
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      const maxIndex = this.getMaxIndex();
      if (this.currentIndex >= maxIndex) {
        this.currentIndex = 0;
      } else {
        this.currentIndex++;
      }
      this.updateTrackPosition();
    }, this.options.autoplayDelay);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  // Public method to update data
  updateData(newData) {
    this.data = newData;
    this.totalSlides = this.data.length;
    this.currentIndex = 0;
    this.init();
  }

  // Public method to destroy
  destroy() {
    this.stopAutoplay();
    this.container.innerHTML = "";
  }
}

// Export for ES modules
export default CarouselCards;
