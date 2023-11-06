import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import "./styles/PDFViewer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

function isValid(left, top, ranges=[]) {
  // console.log("-----")
  // console.log(typeof(left), typeof(top))
  // console.log(ranges)
  
  left = parseFloat(left.replace('%', '')) * 0.01;
  top = parseFloat(top.replace('%', '')) * 0.01;
  for (let range of ranges) {
    console.log(range[0], range[1], range[2], range[3])
    if (range[0] < left && left < range[1] && range[2] < top && top < range[3]) {
        return true;
    }
  }
  return false;
}

const fetchPDFThroughProxy = async (pdfURL) => {
  try {
      const response = await fetch('http://localhost:3001/v1/pdf', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              url: pdfURL
          })
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const pdfBlob = await response.blob();
      return URL.createObjectURL(pdfBlob);
  } catch (error) {
      console.error('Error fetching PDF through proxy:', error);
      throw error;
  }
};

function PDFViewer(props) {
	const [numPages, setNumPages] = useState(null);
	const [pageNumber, setPageNumber] = useState(1);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);

  console.log(props)

  useEffect(() => {
    const firstPage = Math.min(...Object.keys(props.pdfBoxes).map(Number));
    setPageNumber(firstPage);
  }, [props.pdfBoxes]);


  useEffect(() => {
    // Load the PDF when the component mounts
    (async () => {
        try {
            // Check if URL ends with .html
            if (props.pdfURL.endsWith('.html')) {
                const fileName = props.pdfURL.split('/').pop().replace('.html', '.pdf');
                setPdfDataUrl(process.env.PUBLIC_URL + '/pdfs/' + fileName); // Assuming the file is in the public root directory
            } else {
                const dataUrl = await fetchPDFThroughProxy(props.pdfURL);
                setPdfDataUrl(dataUrl);
            }
        } catch (error) {
            console.error('Failed to load PDF:', error);
        }
    })();
  }, [props.pdfURL]);

  // const myFunction = () => {
  //   try {
  //     const parent = document.querySelector('.react-pdf__Page__textContent.textLayer');
  //     let spans = parent.querySelectorAll('span');
        
  //     for (let span of spans) {
  //         console.log(typeof(pageNumber))
  //         console.log(props.pdfBoxes)
  //         if (isValid(span.style.left, span.style.top, props.pdfBoxes[pageNumber])) {
  //           span.style.backgroundColor = '#ffff0033';
  //         }
  //     }
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

	const onDocumentLoadSuccess = ({ numPages }) => {
		setNumPages(numPages);
	};

	const goToPrevPage = () =>
		setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);

	const goToNextPage = () =>
		setPageNumber(pageNumber + 1 >= numPages ? numPages : pageNumber + 1);

  return (
    <div className="pdf-viewer">
        <div className="page">
            <nav>
                <button className="previous" onClick={goToPrevPage}>Prev</button>
                <button className="next" onClick={goToNextPage}>Next</button>
                <p>
                    Page {pageNumber} of {numPages}
                </p>
            </nav>
            <Document
              file={pdfDataUrl}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page pageNumber={pageNumber}>
                {props.pdfBoxes[pageNumber] && props.pdfBoxes[pageNumber].map((box, index) => (
                    <div 
                        key={index}
                        className="highlight-box"
                        style={{
                            left: `${box[0] * 100}%`,
                            top: `${box[1] * 100}%`,
                            width: `${(box[2] - box[0]) * 100}%`,
                            height: `${(box[3] - box[1]) * 100}%`,
                        }}
                    />
                ))}
            </Page>
            </Document>
        </div>

    </div>
  );
    
};

export default PDFViewer;