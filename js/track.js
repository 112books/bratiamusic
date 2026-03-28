function track(event) {
  if (window.goatcounter) {
    window.goatcounter.count({
      path: event
    });
  }
}