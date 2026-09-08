declare module '*.png' {
    const content: string;
    export default content;
  }
  

  // global.d.ts
interface Window {
  updateAuthorizeStatus: () => void;
  IN: any;
}
