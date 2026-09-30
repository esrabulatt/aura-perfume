// Hash tabanlı rota: #/perfume/3 -> ürün detayı
export const getSelectedId = () => {
  const match = window.location.hash.match(/^#\/perfume\/(\d+)$/);
  return match ? Number(match[1]) : null;
};
