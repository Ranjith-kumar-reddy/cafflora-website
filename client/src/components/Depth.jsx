import { useDepth } from '../hooks.js';

// A photo frame in 3D (see useDepth in hooks.js). The outer element swings into view and
// tracks the mouse; the inner frame is what tilts. `as` sets the outer element, for example
// an <li> in a list. `index` staggers the entrance across a row of three.
export default function Depth({ as: Tag = 'div', className = '', frameClassName = '', index = 0, children }) {
  const ref = useDepth();
  return (
    <Tag ref={ref} className={`depth ${className}`.trim()} style={{ '--i': index % 3 }}>
      <div className={`depth-frame ${frameClassName}`.trim()}>{children}</div>
    </Tag>
  );
}
