import React, { createContext, useState, useContext, forwardRef, useImperativeHandle } from 'react';
// Create a context to share data between components
const ComponentContext = createContext();
/**
 * Component that stores the outputs of the LLMs and shares them between its children
 * @param {Object} props
 * @param {React.Ref} ref
 * @returns Component that shares data between its children
 * 
 */
export const OutputContainer = forwardRef(({children}, ref) => {
    const [outputList, setOutputList] = useState([]);
    const [sharedData, setSharedData]= useState(['']);
    //add empty strings to sharedData array until length is equal to the number of responses
    var i = 0;
    var temp = sharedData;
    const reset = () => {
        setSharedData(['']);
        setOutputList([])
    }
    useImperativeHandle(ref, () => ({
        reset,
        setOutputList
      }));
    while(temp.length < outputList.length){
        if(outputList.length === 0){break;}
        try {
            temp.push('');
        } catch (error) {
            console.log(temp, "temp error");
            throw error;
        }
        
        i++;
        if(i > 100){
            console.log("infinite loop");
            break;
        }
    if(sharedData !== temp){
        setSharedData(temp)
    }
        
    }
    return (
      <ComponentContext.Provider value={{ sharedData, setSharedData, outputList, setOutputList }}>
        {outputList}
      </ComponentContext.Provider>
    );
  });
  export const useComponentContext = () => {
    return useContext(ComponentContext);
  };