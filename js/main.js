const url = '../data/test_file.pdf'

/**
 * Get the almost equality of two numbers
 * 
 * @param {Number} val1 
 * @param {Number} val2 
 * @param {Number} epsilon 
 * @returns {boolean}
 */
const approxEpsilon = (val1, val2, epsilon = 0.0001) => Math.abs(val1 - val2) <= epsilon;

let pdfDoc = null, // document
    pageNum = 1, // current page
    pageIsRendering = false, // when the page is rendering set to true
    pageNumIsPending = null,
    scale = 1.5;

const defaultZoomLevel = .10,
    /** @type {HTMLCanvasElement} */
    canvas = document.querySelector('#pdf-render'),
    ctx = canvas.getContext('2d');

/**
 * Render the page
 * 
 * @param {Number} num Page number being rendered
 */
const renderPage = num => {
    pageIsRendering = true;

    // Get page
    pdfDoc.getPage(num)
        .then(page => {
            // Set scale
            const viewport = page.getViewport({ scale })

            // Support HiDPI-screens.
            const outputScale = window.devicePixelRatio || 1;

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height = Math.floor(viewport.height) + "px";

            const transform = outputScale !== 1
                ? [outputScale, 0, 0, outputScale, 0, 0]
                : null;


            const renderContext = {
                canvasContext: ctx,
                outputScale,
                viewport,
            }
            page.render(renderContext).promise.then(() => {
                pageIsRendering = false;

                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }
            })

            // Output current page number
            document.querySelector('#page-num').textContent = num;
        })
}


/**
 * Check for pages rendering
 * 
 * @param {Number} num Page number
 */
const queueRenderPage = num => {
    if (pageIsRendering) {
        pageNumIsPending = num;
    } else {
        renderPage(num);
    }
}

/**
 * Show previous page
 */
const showPreviousPage = () => {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}

/**
 * Show next page
 */
const showNextPage = () => {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}

/**
 * Zoom in
 */
const zoomIn = () => {
    scale += defaultZoomLevel;
    if (scale >= 7) {
        scale -= defaultZoomLevel;
        return;
    }
    renderPage(pageNum)
}

/**
 * Zoom out
 */
const zoomOut = () => {

    scale -= defaultZoomLevel;
    if (approxEpsilon(scale, 0.10, 0.000001)) {
        scale += defaultZoomLevel;
        return;
    }
    renderPage(pageNum)
}

/**
 * Reset out
 */
const resetZoom = () => {
    scale = 1.0;
    renderPage(pageNum)
}

// Get document
pdfjsLib.getDocument(url).promise
    .then(doc => {
        pdfDoc = doc

        document.querySelector('#page-count').textContent = pdfDoc.numPages

        renderPage(pageNum)
    })
    .catch(err => {
        console.error(err)
        // Display error
        const div = document.createElement('div')
        div.className = 'error';
        div.appendChild(document.createTextNode(err.message))
        document.body.insertBefore(div, canvas)
        // Remove top bar
        document.querySelector('.top-bar').style.display = 'none';
    })

// Button events
document.querySelector('#prev-page').addEventListener('click', showPreviousPage)
document.querySelector('#next-page').addEventListener('click', showNextPage)

// Zoom
document.querySelector('#zoomIn').addEventListener('click', zoomIn)
document.querySelector('#zoomOut').addEventListener('click', zoomOut)
document.querySelector('#resetZoom').addEventListener('click', resetZoom)