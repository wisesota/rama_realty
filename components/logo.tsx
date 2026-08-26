type LogoProps = {
  inverse?: boolean;
};

export function Logo({ inverse = false }: LogoProps) {
  return (
    <span className={`brand-lockup${inverse ? " brand-lockup--inverse" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark__point" />
      </span>
      <span className="brand-name">
        <span className="brand-name__rama">RAMA</span>
      </span>
    </span>
  );
}
