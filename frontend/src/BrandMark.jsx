import waikatoLogo from './assets/waikato-logo.png';

function BrandMark() {
  return (
    <span className="brand-mark">
      <span className="brand-logo">
        <img src={waikatoLogo} alt="The University of Waikato" />
      </span>
      <span className="brand-title">Parking</span>
    </span>
  );
}

export default BrandMark;
