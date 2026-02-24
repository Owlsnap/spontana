import React from "react";
import "./Searchbar.css";



const Searchbar = () => {
    return (
        <div className="searchbar">
            <input
            type="text"
            placeholder="Sök på städer, datum, evenemang...(ej tillgängligt)"
            className="search-input"
            />
        </div>
        );
    
}

export default Searchbar;