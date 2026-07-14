/* Earthy motion — playful-but-calm interactivity for V Soap Bar.
   Loaded only when the "Gentle motion" theme setting is enabled.
   Every effect respects prefers-reduced-motion and skips touch-only devices
   where hovering isn't possible. */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------------------------------------------------------------
     1. Hero headline: words wake up one by one
     --------------------------------------------------------------- */
  function initWordReveal(root) {
    if (reducedMotion.matches) return;

    root.querySelectorAll('.banner__heading:not([data-earthy-words])').forEach(function (heading) {
      // Only split headings made of plain text — rich formatting stays untouched.
      if (heading.children.length > 0) return;

      var words = heading.textContent.trim().split(/\s+/);
      if (words.length < 2) return;

      heading.setAttribute('data-earthy-words', '');
      heading.textContent = '';
      words.forEach(function (word, index) {
        var span = document.createElement('span');
        span.className = 'earthy-word';
        span.style.setProperty('--word-delay', 0.15 + index * 0.09 + 's');
        span.textContent = word;
        heading.appendChild(span);
        if (index < words.length - 1) heading.appendChild(document.createTextNode(' '));
      });
    });
  }

  /* ---------------------------------------------------------------
     2. Product cards: tilt gently toward the mouse
     --------------------------------------------------------------- */
  var MAX_TILT = 5; // degrees

  function handleTiltMove(event) {
    var wrapper = event.currentTarget;
    var card = wrapper.earthyCard;
    if (!card) return;

    if (wrapper.earthyRaf) cancelAnimationFrame(wrapper.earthyRaf);
    wrapper.earthyRaf = requestAnimationFrame(function () {
      var rect = wrapper.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        'perspective(80rem) translateY(-0.4rem) rotateX(' + (-y * MAX_TILT).toFixed(2) + 'deg) rotateY(' + (x * MAX_TILT).toFixed(2) + 'deg)';
    });
  }

  function handleTiltLeave(event) {
    var wrapper = event.currentTarget;
    if (wrapper.earthyRaf) cancelAnimationFrame(wrapper.earthyRaf);
    if (wrapper.earthyCard) wrapper.earthyCard.style.transform = '';
  }

  function initCardTilt(root) {
    if (reducedMotion.matches || !canHover.matches) return;

    root.querySelectorAll('.card-wrapper:not([data-earthy-tilt])').forEach(function (wrapper) {
      var card = wrapper.querySelector('.card');
      if (!card) return;

      wrapper.setAttribute('data-earthy-tilt', '');
      wrapper.earthyCard = card;
      wrapper.addEventListener('mousemove', handleTiltMove);
      wrapper.addEventListener('mouseleave', handleTiltLeave);
    });
  }

  /* ---------------------------------------------------------------
     3. Big photos: drift slower than the page while scrolling
     --------------------------------------------------------------- */
  var DRIFT = 30; // max pixels of drift in each direction
  var parallaxItems = [];
  var parallaxScheduled = false;

  function collectParallaxItems() {
    parallaxItems = [];
    if (reducedMotion.matches || window.innerWidth < 750) return;

    document
      .querySelectorAll('.banner__media:not(.placeholder) > img, .image-with-text__media > img')
      .forEach(function (img) {
        parallaxItems.push(img);
        img.style.willChange = 'transform';
      });
  }

  function applyParallax() {
    parallaxScheduled = false;
    var viewportHeight = window.innerHeight;

    parallaxItems.forEach(function (img) {
      var rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) return;

      // -1 when the photo is entering at the bottom, 0 centered, +1 leaving at the top.
      var center = rect.top + rect.height / 2;
      var progress = (viewportHeight / 2 - center) / (viewportHeight / 2 + rect.height / 2);
      var shift = Math.max(-1, Math.min(1, progress)) * DRIFT;
      img.style.transform = 'translate3d(0, ' + shift.toFixed(1) + 'px, 0) scale(1.08)';
    });
  }

  function onScroll() {
    if (parallaxScheduled || parallaxItems.length === 0) return;
    parallaxScheduled = true;
    requestAnimationFrame(applyParallax);
  }

  /* ---------------------------------------------------------------
     Boot + keep working inside the Shopify theme editor
     --------------------------------------------------------------- */
  function init(root) {
    initWordReveal(root || document);
    initCardTilt(root || document);
    collectParallaxItems();
    applyParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    collectParallaxItems();
    onScroll();
  });

  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });
})();
