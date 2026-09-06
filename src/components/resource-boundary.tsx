import {Component, type ReactNode} from 'react';

/** A failed optional download must not take the reading interface with it. */
export default class ResourceBoundary extends Component<{name:string;children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="resource-error" role="status"><p>The {this.props.name} could not load. Your lesson and saved progress are still available.</p><button onClick={()=>window.location.reload()}>Reload this page to retry</button></div>:this.props.children;}
}
