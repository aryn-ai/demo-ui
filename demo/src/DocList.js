import React, {forwardRef, useCallback, useContext, useImperativeHandle, useState} from "react"
import "./styles/DocumentItem.css";
import { SettingContext } from "./App";
const sumDoc = async (text) => {
    return text;
    }
    async function handleDoc(doc, index) {
        doc = doc._source;
        const summary = await sumDoc(doc.summary);

        return { url: doc.url, boxes: doc.boxes, index: index, summary: summary, title: doc.title };
      }

export async function handleDocs(docs) {
    const promisesArray = docs.map((doc, index) => handleDoc(doc, index));
    const result = await Promise.all(promisesArray);
    return result;
  };
function createList(inputList, content = false) {
    if (!Array.isArray(inputList)) {
      throw new Error("Input must be an array.");
    }
  
    const emptyStringList = new Array(inputList.length).fill(content);
    return emptyStringList;
  }
  
const checkedContext = React.createContext();
/**
 * Component that displays a list of documents, and allows the user to select documents
 * @param {Object} props
 * @param {Array} props.docs
 * @param {Function} props.setUrl
 * @param {React.Ref} ref
 * @returns Component that displays a list of documents
 * 
 */

export const DocList = forwardRef((props, ref) => {
    const {settings, setSettings} = useContext(SettingContext);
    const numDocs = settings.numDocs;
    const { docs, setDoc } = props;
//    const { url, setUrl } = props;
    const [checkedList, setCheckedList] = useState(createList(docs));
    const reset = () => {
        setCheckedList(createList(docs));
    };

    useImperativeHandle(ref, () => ({
        checkedList, reset
    }));
    //update the checkmarks when the docs change
    const newCheckedList = useCallback(() => {
        setCheckedList(createList(docs));
        }, [docs]);
    React.useEffect(() => {
        newCheckedList();
        }, [newCheckedList]);

    const selectAll = (e) => {
        setCheckedList(createList(docs, true));
    };
    function adjustBooleanArray(array) {
        const newArray = [...array]; // Create a copy of the original array to avoid mutation
        let trueCount = newArray.filter(value => value).length;
        let currentIndex = 0;
      
        while (trueCount < numDocs) {
          if (!newArray[currentIndex]) {
            newArray[currentIndex] = true;
            trueCount++;
          }
          currentIndex = (currentIndex + 1) % newArray.length;
        }
      
        return newArray;
      }
      
    const selectFirst7 = (e) => {
        //create an array by changing the first elements of checkedList to be true until their are 7 true elements in the array
        if(docs.length < numDocs){
            setCheckedList(createList(docs, true));
            return;
        }
        const booleanArray = adjustBooleanArray(checkedList);
        setCheckedList(booleanArray);
    }

    const deselectAll = (e) => {
        setCheckedList(createList(docs));
    };
    return (
        <checkedContext.Provider className="document-list" value = {{checkedList, setCheckedList}}>
        {/* Display your list of documents here */}
        <div className="selectAll">
            <button onClick = {selectFirst7}> {`Select The first ${numDocs}`} </button>
            <button onClick = {deselectAll}> Deselect All </button>
        </div>
        {docs.map((doc, index) => (
            <DocumentItem doc={doc} setDoc={setDoc} index={index} key = {index} />
        ))}
        </checkedContext.Provider>
    );
    });

//This code is used to render the document items that are retrieved from the database.
//It also adds a checkbox to each document item and stores the state of the checkbox in the checkedList variable.
//The setUrl function is used to set the URL of the document that is selected. The setUrl function is called in the onClick method of the anchor tag.
//The setCheckedList function is used to update the state of the checkbox when the input is changed.
const DocumentItem = (props) => {
    const { doc, setDoc, index } = props;
//    const { index, setIndex } = props;
    const { checkedList, setCheckedList } = React.useContext(checkedContext);
    var isChecked = checkedList[index]
    const setChecked = (checked) => {
        isChecked = checked;
    };
    const setIsChecked = (checked) => {
        setCheckedList((prev) => {
        const newList = [...prev];
        newList[index] = checked;
        return newList;
        }
        );
        setChecked(checked);
    };
    
    console.log(doc)
    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
        };
    return (
        <div className="document-item" key={index}>
        {/* Pass the content as a prop to the PDFViewer component */}
            <div className="control-container">
        <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className='doc-link'
            >
          {doc.url}
        </a>

                <label className="checkbox-container">
                <input
                name="checkbox"
                type="checkbox"
                checked={isChecked? true : false}
                onChange={handleCheckboxChange}
                />
                <span className="checkmark"></span>
                </label>
                <button 
                    className='doc-button' 
                    onClick={() => {
                        setDoc(doc);
                    }}>
                    {"original source"}
                </button>
            </div>


        <h2 className='docTitle'>
            {(index + 1) + '. ' + doc.title}
        </h2>
        <p>{doc.summary}</p>
        </div>
    )
}
