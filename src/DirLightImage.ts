import {
    BufferGeometry, ColorRepresentation,
    DirectionalLight,
    Float32BufferAttribute,
    Light,
    Line,
    LineBasicMaterial,
    Object3D,
    Vector3
} from 'three'

const _v1 = /*@__PURE__*/ new Vector3();
const _v2 = /*@__PURE__*/ new Vector3();
const _v3 = /*@__PURE__*/ new Vector3();

class DirLightHelper extends Object3D {

    private lightPlane: Line<BufferGeometry, LineBasicMaterial>
    private targetLine: Line<BufferGeometry, LineBasicMaterial>
    constructor(
        private light: DirectionalLight,
        private size = 1,
        private color: ColorRepresentation
    ) {
        super();

        this.matrix = light.matrixWorld;
        this.matrixAutoUpdate = false;

        this.type = 'DirectionalLightHelper';


        let geometry = new BufferGeometry();
        geometry.setAttribute( 'position', new Float32BufferAttribute( [
            - size, size, 0,
            size, size, 0,
            size, - size, 0,
            - size, - size, 0,
            - size, size, 0
        ], 3 ) );

        const material = new LineBasicMaterial( { fog: false, toneMapped: false } );

        this.lightPlane = new Line( geometry, material );
        this.add( this.lightPlane );

        geometry = new BufferGeometry();
        geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, 1 ], 3 ) );

        this.targetLine = new Line( geometry, material );
        this.add( this.targetLine );

        this.update();

    }

    dispose() {

        this.lightPlane.geometry.dispose();
        this.lightPlane.material.dispose();
        this.targetLine.geometry.dispose();
        this.targetLine.material.dispose();

    }

    update() {

        //this.light.updateWorldMatrix( true, false );
        //this.light.target.updateWorldMatrix( true, false );

        _v1.setFromMatrixPosition( this.light.matrixWorld );
        _v2.setFromMatrixPosition( this.light.target.matrixWorld );
        _v3.subVectors( this.light.target.position, this.light.position );
//console.log(_v1, this.light.position)
        //this.lightPlane.lookAt( this.light.target.position );

        if ( this.color !== undefined ) {

            this.lightPlane.material.color.set( this.color );
            this.targetLine.material.color.set( this.color );

        } else {

            this.lightPlane.material.color.copy( this.light.color );
            this.targetLine.material.color.copy( this.light.color );

        }

        this.targetLine.lookAt( this.light.target.position );
        this.targetLine.scale.z = _v3.length();

    }

}

export default DirLightHelper