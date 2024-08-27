interface ResultCardProps {
    result: string;
}

export default function ResultCard({ result }: ResultCardProps) {
    return (
        <div className="mt-4 p-4 border rounded">
            <h2 className="text-xl font-bold mb-2">Result:</h2>
            <p>{result}</p>
        </div>
    );
}
