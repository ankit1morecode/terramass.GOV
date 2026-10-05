/** Fixed, decorative 3D backdrop: drifting aurora + perspective grid floor. */
export const SceneBackground = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="scene-aurora absolute -inset-[10%]" />
    <div className="scene-grid absolute inset-x-0 bottom-0 h-[55%]">
      <div />
    </div>
  </div>
);
