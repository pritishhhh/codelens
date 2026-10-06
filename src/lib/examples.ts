import type { SupportedLanguage } from "@/types/language";

// Intentionally imperfect examples give users concrete code to review and improve.
export const REVIEW_EXAMPLES: Record<SupportedLanguage, string> = {
  javascript: `function getActiveUsers(users) {
  return users.filter(user => user.active == true)
    .map(user => ({ name: user.name, email: user.email }));
}

async function loadUsers() {
  const response = await fetch("/api/users");
  const users = await response.json();
  return getActiveUsers(users);
}`,
  typescript: `type User = { id: number; name: string; active: boolean };

function findUser(users: User[], id: number): string {
  const user = users.find(user => user.id === id);
  return user!.name;
}`,
  python: `def average(numbers):
    total = 0
    for number in numbers:
        total += number
    return total / len(numbers)

print(average([]))`,
  java: `import java.util.List;

class Scores {
    static double average(List<Integer> scores) {
        int total = 0;
        for (int score : scores) total += score;
        return total / scores.size();
    }
}`,
  cpp: `#include <vector>

double average(const std::vector<int>& scores) {
    int total = 0;
    for (int score : scores) total += score;
    return total / scores.size();
}`,
  go: `package main

import "fmt"

func average(scores []int) float64 {
    total := 0
    for _, score := range scores {
        total += score
    }
    return float64(total / len(scores))
}

func main() {
    fmt.Println(average([]int{}))
}`,
};

export const COMPARE_EXAMPLES: Record<SupportedLanguage, [string, string]> = {
  javascript: [
    `function unique(values) {
  return values.filter((value, index) => values.indexOf(value) === index);
}`,
    `function unique(values) {
  return [...new Set(values)];
}`,
  ],
  typescript: [
    `function unique<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}`,
    `function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}`,
  ],
  python: [
    `def unique(values):
    result = []
    for value in values:
        if value not in result:
            result.append(value)
    return result`,
    `def unique(values):
    return list(dict.fromkeys(values))`,
  ],
  java: [
    `import java.util.*;

class Unique {
    static List<Integer> unique(List<Integer> values) {
        List<Integer> result = new ArrayList<>();
        for (int value : values) {
            if (!result.contains(value)) result.add(value);
        }
        return result;
    }
}`,
    `import java.util.*;

class Unique {
    static List<Integer> unique(List<Integer> values) {
        return new ArrayList<>(new LinkedHashSet<>(values));
    }
}`,
  ],
  cpp: [
    `#include <vector>
#include <algorithm>

std::vector<int> unique(const std::vector<int>& values) {
    std::vector<int> result;
    for (int value : values) {
        if (std::find(result.begin(), result.end(), value) == result.end())
            result.push_back(value);
    }
    return result;
}`,
    `#include <vector>
#include <unordered_set>

std::vector<int> unique(const std::vector<int>& values) {
    std::unordered_set<int> seen;
    std::vector<int> result;
    for (int value : values) {
        if (seen.insert(value).second) result.push_back(value);
    }
    return result;
}`,
  ],
  go: [
    `func unique(values []int) []int {
    result := []int{}
    for _, value := range values {
        found := false
        for _, existing := range result {
            if existing == value { found = true; break }
        }
        if !found { result = append(result, value) }
    }
    return result
}`,
    `func unique(values []int) []int {
    seen := make(map[int]bool)
    result := []int{}
    for _, value := range values {
        if !seen[value] {
            seen[value] = true
            result = append(result, value)
        }
    }
    return result
}`,
  ],
};
