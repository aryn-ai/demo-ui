// function isValid(left, top, ranges) {
//     for (let range of ranges) {
//         if (range[0] < left && left < range[1] && range[2] < top && top < range[3]) {
//             return true;
//         }
//     }
//     return false;
// }

// function make_text_background_yellow(element) {
//     element.style.backgroundColor = '#ffff0033';
// }

// export function highlight_pdf(document, jsonString) {

//     // try {
//     //     let jsonObj = JSON.parse(jsonString);
//     //     console.log(jsonObj);
//     //     } catch (error) {
//     //     console.log(error); // Outputs: SyntaxError: Unexpected token N in JSON at position 0
//     // }

//     let jsonObj = JSON.parse(jsonString);

//     let validPages = Object.keys(jsonObj)

//     let pages = document.querySelectorAll('.page');
//     console.log("Checking pages", pages);

//     // page = Array.prototype.slice.call(pages);
//     for (let page of pages) {
//         console.log("Checking page", page.getAttribute('data-page-number'));
//         let pageNum = parseInt(page.getAttribute('data-page-number'))
//         if (validPages.includes(pageNum)) {
//             console.log('in valid page');

//             let textLayer = page.querySelector('.textLayer');
//             let spans = textLayer.querySelectorAll('span');
//             console.log("textlayer", textLayer)
//             console.log("spans", spans)
            
//             for (let span of spans) {
//                 if (isValid(span.style.left, span.style.top, jsonObj.pageNum)) {
//                     console.log('in valid span');
//                     make_text_background_yellow(span);
//                 }
//             }
//         }
//     }
// }
