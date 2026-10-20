// A label and an input, tied together for screen readers.
function FormField({ id, label, ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...inputProps} />
    </div>
  );
}

export default FormField;
