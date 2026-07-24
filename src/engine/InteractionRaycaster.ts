import * as THREE from 'three';

export class InteractionRaycaster {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private interactableObjects: THREE.Object3D[] = [];
  private selectedIndex: number = -1;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private onSelectCallback: (obj: THREE.Object3D) => void;
  private onFocusCallback: (obj: THREE.Object3D) => void;

  constructor(
    camera: THREE.Camera, 
    domElement: HTMLElement, 
    onSelect: (obj: THREE.Object3D) => void,
    onFocus: (obj: THREE.Object3D) => void
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.onSelectCallback = onSelect;
    this.onFocusCallback = onFocus;
    
    // Add event listeners for keyboard navigation
    this.domElement.tabIndex = 0; // Make focusable
    this.domElement.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  public setInteractableObjects(objects: THREE.Object3D[]) {
    this.interactableObjects = objects;
    this.selectedIndex = -1;
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.interactableObjects.length === 0) return;

    if (event.key === 'Tab') {
      event.preventDefault(); // Prevent leaving the canvas immediately
      if (event.shiftKey) {
        this.selectedIndex = (this.selectedIndex - 1 + this.interactableObjects.length) % this.interactableObjects.length;
      } else {
        this.selectedIndex = (this.selectedIndex + 1) % this.interactableObjects.length;
      }
      this.focusSelected();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.interactableObjects.length;
      this.focusSelected();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.interactableObjects.length) % this.interactableObjects.length;
      this.focusSelected();
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedIndex >= 0 && this.selectedIndex < this.interactableObjects.length) {
        this.onSelectCallback(this.interactableObjects[this.selectedIndex]);
      }
    }
  }

  private focusSelected() {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.interactableObjects.length) {
      const obj = this.interactableObjects[this.selectedIndex];
      this.onFocusCallback(obj);
    }
  }

  public raycast(x: number, y: number): THREE.Intersection[] {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(this.interactableObjects, true);
  }
}
