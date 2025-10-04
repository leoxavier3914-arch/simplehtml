const links = document.querySelectorAll("a.cta");
links.forEach((link) => {
  link.addEventListener("mouseover", () => link.classList.add("cta-hover"));
  link.addEventListener("mouseleave", () => link.classList.remove("cta-hover"));
});
