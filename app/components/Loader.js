// export default function Loader() {
//   return (
//     <div className="flex justify-center items-center min-h-[200px]">
//       <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
//     </div>
//   );
// }

export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-white/80 dark:bg-black/40">
      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-500 border-solid"></div>
    </div>
  );
}
