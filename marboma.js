/* =========================================================
   Marboma – site-wide JavaScript
   Wordt ingeladen via jsDelivr vanuit GitHub (niice-nocode/marboma)
   Vereist (in Webflow, vóór dit script): GSAP, ScrollTrigger, SplitText, Vimeo Player API
   ========================================================= */

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ---------------------------------------------------------
   Vimeo achtergrondvideo (Osmo)
   --------------------------------------------------------- */
function initVimeoBGVideo() {
  document.querySelectorAll("[data-vimeo-bg-init]").forEach((vimeoElement, index) => {
    const idSource = vimeoElement.querySelector("[data-vimeo-id-source]");
    const vimeoVideoID = (idSource && idSource.textContent.trim()) || vimeoElement.getAttribute("data-vimeo-video-id");
    if (!vimeoVideoID || typeof Vimeo === "undefined") return;

    const vimeoVideoURL = `https://player.vimeo.com/video/${vimeoVideoID}?api=1&background=1&autoplay=0&loop=1&muted=1`;
    vimeoElement.querySelector("iframe").setAttribute("src", vimeoVideoURL);
    vimeoElement.setAttribute("id", "vimeo-bg-index-" + index);
    const player = new Vimeo.Player(vimeoElement.id);

    let videoAspectRatio;

    function adjustVideoSizing() {
      const containerAspectRatio = (vimeoElement.offsetHeight / vimeoElement.offsetWidth) * 100;
      const iframeWrapper = vimeoElement.querySelector(".vimeo-bg_iframe-wrapper");
      if (iframeWrapper && videoAspectRatio) {
        iframeWrapper.style.width =
          containerAspectRatio > videoAspectRatio * 100
            ? `${(containerAspectRatio / (videoAspectRatio * 100)) * 100}%`
            : "";
      }
    }

    if (vimeoElement.getAttribute("data-vimeo-update-size") === "true") {
      player.getVideoWidth().then((width) => {
        player.getVideoHeight().then((height) => {
          videoAspectRatio = height / width;
          const beforeEl = vimeoElement.querySelector(".vimeo-bg_before");
          if (beforeEl) beforeEl.style.paddingTop = videoAspectRatio * 100 + "%";
          adjustVideoSizing();
        });
      });
    }

    adjustVideoSizing();
    window.addEventListener("resize", adjustVideoSizing);

    player.on("play", () => vimeoElement.setAttribute("data-vimeo-loaded", "true"));
    player.on("pause", () => vimeoElement.setAttribute("data-vimeo-playing", "false"));

    function play() {
      vimeoElement.setAttribute("data-vimeo-activated", "true");
      vimeoElement.setAttribute("data-vimeo-playing", "true");
      player.play();
    }

    if (vimeoElement.getAttribute("data-vimeo-autoplay") === "false") {
      player.pause();
    } else {
      const checkVisibility = () => {
        const rect = vimeoElement.getBoundingClientRect();
        rect.top < window.innerHeight && rect.bottom > 0 ? play() : player.pause();
      };
      checkVisibility();
      window.addEventListener("scroll", checkVisibility, { passive: true });
    }
  });
}

/* ---------------------------------------------------------
   Highlight text on scroll (Osmo)
   --------------------------------------------------------- */
function initHighlightText() {
  document.querySelectorAll("[data-highlight-text]").forEach((heading) => {
    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 90%";
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 40%";
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2;
    const staggerValue = heading.getAttribute("data-highlight-stagger") || 0.1;

    new SplitText(heading, {
      type: "words, chars",
      autoSplit: true,
      onSplit(self) {
        return gsap.context(() => {
          gsap.timeline({
            scrollTrigger: { scrub: true, trigger: heading, start: scrollStart, end: scrollEnd },
          }).from(self.chars, { autoAlpha: fadedValue, stagger: staggerValue, ease: "linear" });
        });
      },
    });
  });
}

/* ---------------------------------------------------------
   CSS marquee (Osmo)
   --------------------------------------------------------- */
function initCSSMarquee() {
  const pixelsPerSecond = 75;
  const marquees = document.querySelectorAll("[data-css-marquee]");

  marquees.forEach((marquee) => {
    marquee.querySelectorAll("[data-css-marquee-list]").forEach((list) => {
      marquee.appendChild(list.cloneNode(true));
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.querySelectorAll("[data-css-marquee-list]").forEach((list) => {
        list.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      });
    });
  }, { threshold: 0 });

  marquees.forEach((marquee) => {
    marquee.querySelectorAll("[data-css-marquee-list]").forEach((list) => {
      list.style.animationDuration = list.offsetWidth / pixelsPerSecond + "s";
      list.style.animationPlayState = "paused";
    });
    observer.observe(marquee);
  });
}

/* ---------------------------------------------------------
   Tab system met autoplay (Osmo, aangepast: direct klikbaar)
   --------------------------------------------------------- */
function initTabSystem() {
  document.querySelectorAll('[data-tabs="wrapper"]').forEach((wrapper) => {
     // Afbeeldingen uit de Tab stappen naar het beeldvlak verplaatsen
      const visualList = wrapper.querySelector('[data-tabs="visual-list"]') || wrapper.querySelector('.howitworks_visual');
      if (visualList) {
     wrapper.querySelectorAll('[data-tabs="content-item"] [data-tabs="visual-item"]').forEach((v) => visualList.appendChild(v));
      }
    const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]');
    const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]');
    if (!contentItems.length) return;
    const autoplay = wrapper.dataset.tabsAutoplay === "true";
    const autoplayDuration = parseInt(wrapper.dataset.tabsAutoplayDuration) || 5000;

    let activeContent = null;
    let tl = null;
    let progressBarTween = null;

    function startProgressBar(index) {
      if (progressBarTween) progressBarTween.kill();
      const bar = contentItems[index].querySelector('[data-tabs="item-progress"]');
      if (!bar) return;
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
      progressBarTween = gsap.to(bar, {
        scaleX: 1,
        duration: autoplayDuration / 1000,
        ease: "power1.inOut",
        onComplete: () => switchTab((index + 1) % contentItems.length),
      });
    }

    function switchTab(index) {
      const incomingContent = contentItems[index];
      if (incomingContent === activeContent) return;
      if (tl) tl.kill();
      if (progressBarTween) progressBarTween.kill();

      activeContent = incomingContent;
      const incomingVisual = visualItems[index];
      const incomingDetails = incomingContent.querySelector('[data-tabs="item-details"]');
      const incomingBar = incomingContent.querySelector('[data-tabs="item-progress"]');

      contentItems.forEach((item) => item.classList.toggle("active", item === incomingContent));
      visualItems.forEach((item) => item.classList.toggle("active", item === incomingVisual));

      tl = gsap.timeline({
        defaults: { duration: 0.65, ease: "power3" },
        onComplete: () => { if (autoplay) startProgressBar(index); },
      });

      contentItems.forEach((item, i) => {
        if (i === index) return;
        tl.to(item.querySelector('[data-tabs="item-details"]'), { height: 0 }, 0)
          .to(item.querySelector('[data-tabs="item-progress"]'), { scaleX: 0, transformOrigin: "right center", duration: 0.3 }, 0)
          .to(visualItems[i], { autoAlpha: 0, xPercent: 3 }, 0);
      });

      if (incomingVisual && gsap.getProperty(incomingVisual, "opacity") === 0) {
        gsap.set(incomingVisual, { xPercent: 3 });
      }
      tl.set(incomingBar, { scaleX: 0, transformOrigin: "left center" }, 0)
        .to(incomingDetails, { height: "auto" }, 0)
        .to(incomingVisual, { autoAlpha: 1, xPercent: 0 }, 0.15);
    }

    switchTab(0);

    contentItems.forEach((item, i) => {
      item.addEventListener("click", () => switchTab(i));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          switchTab(i);
        }
      });
    });
  });
}

/* ---------------------------------------------------------
   Parallax (site-breed)
   data-parallax="10"     = element beweegt mee (hoger = sneller)
   data-parallax-image    = afbeelding beweegt binnen zijn kader
   data-parallax="align"  = verspringend blok, midden in beeld gelijk
   data-parallax-trigger  = (optioneel) ouder-element dat de scroll bepaalt
   --------------------------------------------------------- */
function initParallax() {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
    const scroll = (trigger) => ({
      trigger, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true,
    });

    document.querySelectorAll('[data-parallax]:not([data-parallax="align"])').forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 10;
      const trigger = el.closest("[data-parallax-trigger]") || el;
      gsap.fromTo(el, { yPercent: speed }, { yPercent: -speed, ease: "none", scrollTrigger: scroll(trigger) });
    });

    document.querySelectorAll("[data-parallax-image]").forEach((img) => {
      const frame = img.parentElement;
      frame.style.overflow = "hidden";
      gsap.fromTo(img,
        { yPercent: -8, scale: 1.16 },
        { yPercent: 8, scale: 1.16, ease: "none", scrollTrigger: scroll(frame) }
      );
    });

    document.querySelectorAll('[data-parallax="align"]').forEach((el) => {
      const trigger = el.closest("[data-parallax-trigger]") || el.parentElement;
      const offset = () => parseFloat(getComputedStyle(el).marginTop) || 0;
      gsap.fromTo(el,
        { y: () => offset() * 0.5 },
        { y: () => -offset() * 2.5, ease: "none", scrollTrigger: scroll(trigger) }
      );
    });
  });
}

/* ---------------------------------------------------------
   Review slider line reveal (Osmo)
   --------------------------------------------------------- */
function initLineRevealTestimonials() {
  const imageClipHidden = "circle(0% at 50% 50%)";
  const imageClipVisible = "circle(50% at 50% 50%)";

  document.querySelectorAll("[data-testimonial-wrap]").forEach((wrap) => {
    const list = wrap.querySelector("[data-testimonial-list]");
    if (!list) return;
    const items = Array.from(list.querySelectorAll("[data-testimonial-item]"));
    if (!items.length) return;

    const btnPrev = wrap.querySelector("[data-prev]");
    const btnNext = wrap.querySelector("[data-next]");
    const elCurrent = wrap.querySelector("[data-current]");
    const elTotal = wrap.querySelector("[data-total]");
    if (elTotal) elTotal.textContent = String(items.length);

    let activeIndex = items.findIndex((el) => el.classList.contains("is--active"));
    if (activeIndex < 0) activeIndex = 0;

    let isAnimating = false;
    let reduceMotion = false;
    const autoplayEnabled = wrap.getAttribute("data-autoplay") === "true";
    const autoplayDuration = parseInt(wrap.getAttribute("data-autoplay-duration"), 10) || 4000;
    let autoplayCall = null;
    let isInView = true;

    const slides = items.map((item) => ({
      item,
      image: item.querySelector("[data-testimonial-img]"),
      splitTargets: [
        item.querySelector("[data-testimonial-text]"),
        ...item.querySelectorAll("[data-testimonial-split]"),
      ].filter(Boolean),
      splitInstances: [],
      getLines() { return this.splitInstances.flatMap((i) => i.lines); },
    }));

    function setSlideState(i, isActive) {
      const { item } = slides[i];
      item.classList.toggle("is--active", isActive);
      item.setAttribute("aria-hidden", String(!isActive));
      gsap.set(item, { autoAlpha: isActive ? 1 : 0, pointerEvents: isActive ? "auto" : "none" });
    }
    const updateCounter = () => { if (elCurrent) elCurrent.textContent = String(activeIndex + 1); };

    function startAutoplay() {
      if (!autoplayEnabled) return;
      if (autoplayCall) autoplayCall.kill();
      autoplayCall = gsap.delayedCall(autoplayDuration / 1000, () => {
        if (!isInView || isAnimating) { startAutoplay(); return; }
        goTo((activeIndex + 1) % slides.length);
        startAutoplay();
      });
    }
    const pauseAutoplay = () => { if (autoplayCall) autoplayCall.pause(); };
    const resumeAutoplay = () => { if (!autoplayEnabled) return; autoplayCall ? autoplayCall.resume() : startAutoplay(); };
    const resetAutoplay = () => { if (autoplayEnabled) startAutoplay(); };

    slides.forEach((_, i) => setSlideState(i, i === activeIndex));
    updateCounter();

    gsap.matchMedia().add({ reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      reduceMotion = ctx.conditions.reduce;
    });

    slides.forEach((slide, slideIndex) => {
      slide.splitInstances = slide.splitTargets.map((el) =>
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "text-line",
          autoSplit: true,
          onSplit(self) {
            if (reduceMotion) return;
            const isActive = slideIndex === activeIndex;
            gsap.set(self.lines, { yPercent: isActive ? 0 : 110 });
            if (slide.image) gsap.set(slide.image, { clipPath: isActive ? imageClipVisible : imageClipHidden });
          },
        })
      );
    });

    function goTo(nextIndex) {
      if (isAnimating || nextIndex === activeIndex) return;
      isAnimating = true;
      const outgoing = slides[activeIndex];
      const incoming = slides[nextIndex];

      const tl = gsap.timeline({
        onComplete: () => {
          setSlideState(activeIndex, false);
          setSlideState(nextIndex, true);
          activeIndex = nextIndex;
          updateCounter();
          isAnimating = false;
        },
      });

      if (reduceMotion) {
        tl.to(outgoing.item, { autoAlpha: 0, duration: 0.4, ease: "power2" }, 0)
          .fromTo(incoming.item, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2" }, 0);
        return;
      }

      gsap.set(incoming.item, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(incoming.getLines(), { yPercent: 110 });
      if (outgoing.image) gsap.set(outgoing.image, { clipPath: imageClipVisible });

      tl.to(outgoing.getLines(), { yPercent: -110, duration: 0.6, ease: "power4.inOut", stagger: { amount: 0.25 } }, 0);
      if (outgoing.image) tl.to(outgoing.image, { clipPath: imageClipHidden, duration: 0.6, ease: "power4.inOut" }, 0);
      tl.to(incoming.getLines(), { yPercent: 0, duration: 0.7, ease: "power4.inOut", stagger: { amount: 0.4 } }, ">-=0.3");
      if (incoming.image) tl.fromTo(incoming.image, { clipPath: imageClipHidden }, { clipPath: imageClipVisible, duration: 0.75, ease: "power4.inOut" }, "<");
      tl.set(outgoing.item, { autoAlpha: 0 }, ">");
    }

    startAutoplay();

    if (btnNext) btnNext.addEventListener("click", (e) => { e.preventDefault(); resetAutoplay(); goTo((activeIndex + 1) % slides.length); });
    if (btnPrev) btnPrev.addEventListener("click", (e) => { e.preventDefault(); resetAutoplay(); goTo((activeIndex - 1 + slides.length) % slides.length); });

    window.addEventListener("keydown", (e) => {
      if (!isInView) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); resetAutoplay(); goTo((activeIndex + 1) % slides.length); }
      if (e.key === "ArrowLeft") { e.preventDefault(); resetAutoplay(); goTo((activeIndex - 1 + slides.length) % slides.length); }
    });

    ScrollTrigger.create({
      trigger: wrap, start: "top bottom", end: "bottom top",
      onEnter: () => { isInView = true; resumeAutoplay(); },
      onEnterBack: () => { isInView = true; resumeAutoplay(); },
      onLeave: () => { isInView = false; pauseAutoplay(); },
      onLeaveBack: () => { isInView = false; pauseAutoplay(); },
    });
  });
}

/* ---------------------------------------------------------
   Form validation (Osmo)
   --------------------------------------------------------- */
function initBasicFormValidation() {
  document.querySelectorAll("[data-form-validate]").forEach((formContainer) => {
    const startTime = new Date().getTime();
    const form = formContainer.querySelector("form");
    if (!form) return;
    const validateFields = form.querySelectorAll("[data-validate]");
    const dataSubmit = form.querySelector("[data-submit]");
    if (!dataSubmit) return;
    const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
    if (!realSubmitInput) return;

    const isSpam = () => new Date().getTime() - startTime < 5000;

    function isValid(fieldGroup) {
      const input = fieldGroup.querySelector("input, textarea");
      if (!input) return false;
      let valid = true;
      const min = parseInt(input.getAttribute("min")) || 0;
      const max = parseInt(input.getAttribute("max")) || Infinity;
      const value = input.value.trim();
      if (input.type === "email") {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      } else {
        if (input.hasAttribute("min") && value.length < min) valid = false;
        if (input.hasAttribute("max") && value.length > max) valid = false;
      }
      return valid;
    }

    function updateFieldStatus(fieldGroup) {
      const input = fieldGroup.querySelector("input, textarea");
      if (!input) return;
      fieldGroup.classList.toggle("is--filled", !!input.value.trim());
      if (isValid(fieldGroup)) {
        fieldGroup.classList.add("is--success");
        fieldGroup.classList.remove("is--error");
      } else {
        fieldGroup.classList.remove("is--success");
        fieldGroup.classList.toggle("is--error", !!input.__validationStarted);
      }
    }

    function validateAll() {
      let allValid = true;
      let firstInvalid = null;
      validateFields.forEach((fieldGroup) => {
        const input = fieldGroup.querySelector("input, textarea");
        if (!input) return;
        input.__validationStarted = true;
        updateFieldStatus(fieldGroup);
        if (!isValid(fieldGroup)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });
      if (firstInvalid) firstInvalid.focus();
      return allValid;
    }

    function trySubmit() {
      if (!validateAll()) return;
      if (isSpam()) {
        alert("Het formulier is te snel verstuurd. Probeer het nog een keer.");
        return;
      }
      form.requestSubmit(realSubmitInput);
    }

    validateFields.forEach((fieldGroup) => {
      const input = fieldGroup.querySelector("input, textarea");
      if (!input) return;
      input.__validationStarted = false;

      input.addEventListener("input", () => {
        const length = input.value.trim().length;
        const min = parseInt(input.getAttribute("min")) || 0;
        const max = parseInt(input.getAttribute("max")) || Infinity;
        if (!input.__validationStarted) {
          if (input.type === "email") {
            if (isValid(fieldGroup)) input.__validationStarted = true;
          } else if ((input.hasAttribute("min") && length >= min) || (input.hasAttribute("max") && length <= max)) {
            input.__validationStarted = true;
          }
        }
        if (input.__validationStarted) updateFieldStatus(fieldGroup);
      });

      input.addEventListener("blur", () => {
        input.__validationStarted = true;
        updateFieldStatus(fieldGroup);
      });
    });

    dataSubmit.addEventListener("click", trySubmit);
    dataSubmit.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trySubmit(); }
    });
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target !== dataSubmit) {
        e.preventDefault();
        trySubmit();
      }
    });
  });
}

/* ---------------------------------------------------------
   Init
   --------------------------------------------------------- */
function initMarboma() {
  initVimeoBGVideo();
  initHighlightText();
  initCSSMarquee();
  initTabSystem();
  initParallax();
  initLineRevealTestimonials();
  initBasicFormValidation();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMarboma);
} else {
  initMarboma();
}
