import { initUI } from '/blogs/js/ui-controller.js';
import { getSubjectData } from '/blogs/js/data.js';

const params = new URLSearchParams(window.location.search);
const subject = params.get('subject') || 'animals';

// All subject data now lives in one place: /blogs/js/data.js
const subjectData = getSubjectData(subject);

const loaderLabel = document.getElementById('loader-label');
if (loaderLabel) loaderLabel.textContent = subjectData.SUBJECT_CONFIG.name;

initUI(subjectData.SUBJECT_CONFIG, subjectData);
