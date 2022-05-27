export function horizontalScroll() {
	const container = document.querySelector('.questions')
	const divQuestionArea = document.querySelector('.question_area')

	if (container.scrollWidth > window.innerWidth - convertRemToPixels(2)) {
		container.classList.add('scroll')
      container.style.overflowX = 'scroll'
	} else if(container.scrollWidth < window.innerWidth - convertRemToPixels(2)) {
      container.classList.remove('scroll')
      container.style.overflowX = 'hidden'
   }

}

function convertRemToPixels(rem) {
	return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}