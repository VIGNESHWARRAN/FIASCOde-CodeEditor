import java.util.ArrayList;
import java.util.List;

class Script {

    public static void main(String[] args) {
        
        int n = 3;
        ArrayList<Object> list = new ArrayList<>(List.of(1, "one", 2, "two", 3, "three"));
        ArrayList<String> words = new ArrayList<>(n);
        ArrayList<Integer> numbers = new ArrayList<>(n);

        for (int i = 0; i < n; i++) {
            words.add((String) list.get(i * 2 + 1));
            numbers.add((Integer) list.get(i * 2));
        }
        
        System.out.println(words);
        System.out.println(numbers);

    }
}