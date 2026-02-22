import type { FormEvent } from "react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
};

export function SearchInput({ value, onChange, onSubmit }: SearchInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value.trim());
  };

  return (
    <div className="search-box search-wrapper">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          className="search-input"
          placeholder="Search route, origin, destination..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="submit" className="search-submit-btn">
          Search
        </button>
      </form>
    </div>
  );
}
