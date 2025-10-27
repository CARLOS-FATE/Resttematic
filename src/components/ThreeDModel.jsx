// src/components/ThreeDModel.jsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';

function Model(props) {
  const { scene } = useGLTF('/models/van_gogh_room.glb');
  
  return <primitive object={scene} scale={0.5} {...props} />;
}

export default function ThreeDModel() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center text-white">
        Cargando modelo 3D...
      </div>
    }>
      
      <Canvas 
        shadows 
        camera={{ position: [0, 2, 10], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        <Model />
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
        
        <Environment preset="sunset" />

      </Canvas>
    </Suspense>
  );
}